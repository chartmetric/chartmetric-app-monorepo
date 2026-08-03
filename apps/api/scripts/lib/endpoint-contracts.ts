import path from "node:path";

import ts from "typescript";

const httpMethods = new Set([
  "delete",
  "get",
  "head",
  "options",
  "patch",
  "post",
  "put",
]);

export interface DiscoveredRoute {
  method: string;
  routePath: string;
}

export interface DiscoveredRegistration {
  routeStem: string;
  surfaces: string[];
}

export interface DiscoveredEndpointContract extends DiscoveredRoute {
  decisions: {
    access: string;
    data: { columns: string[]; table: string }[];
    errors: string;
    filters: string;
    request: string;
    response: string;
  };
  surfaces: string[];
}

const invalid = (filePath: string, reason: string): Error =>
  new Error(`${filePath}: ${reason}`);

const propertyName = (property: ts.ObjectLiteralElementLike): string | null => {
  if (property.name === undefined) return null;
  return ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
    ? property.name.text
    : null;
};

const objectProperty = (
  object: ts.ObjectLiteralExpression,
  name: string,
): ts.Expression | undefined => {
  const property = object.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) && propertyName(candidate) === name,
  );

  return property !== undefined && ts.isPropertyAssignment(property)
    ? property.initializer
    : undefined;
};

const requiredString = (
  object: ts.ObjectLiteralExpression,
  name: string,
  filePath: string,
): string => {
  const value = objectProperty(object, name);

  if (value === undefined || !ts.isStringLiteralLike(value)) {
    throw invalid(filePath, `${name} must be a string literal`);
  }

  if (value.text.trim() === "") {
    throw invalid(filePath, `${name} must not be empty`);
  }

  return value.text;
};

const requiredStrings = (
  object: ts.ObjectLiteralExpression,
  name: string,
  filePath: string,
): string[] => {
  const value = objectProperty(object, name);

  if (value === undefined || !ts.isArrayLiteralExpression(value)) {
    throw invalid(filePath, `${name} must be an array of string literals`);
  }

  const strings = value.elements.map((element) => {
    if (!ts.isStringLiteralLike(element)) {
      throw invalid(filePath, `${name} must contain only string literals`);
    }

    return element.text;
  });

  if (strings.length === 0 || new Set(strings).size !== strings.length) {
    throw invalid(filePath, `${name} must contain unique values`);
  }

  return strings;
};

const requiredObject = (
  object: ts.ObjectLiteralExpression,
  name: string,
  filePath: string,
): ts.ObjectLiteralExpression => {
  const value = objectProperty(object, name);

  if (value === undefined || !ts.isObjectLiteralExpression(value)) {
    throw invalid(filePath, `${name} must be an object literal`);
  }

  return value;
};

const requiredDataSources = (
  decisions: ts.ObjectLiteralExpression,
  filePath: string,
): { columns: string[]; table: string }[] => {
  const value = objectProperty(decisions, "data");

  if (value === undefined || !ts.isArrayLiteralExpression(value)) {
    throw invalid(filePath, "decisions.data must be an array literal");
  }

  const sources = value.elements.map((element) => {
    if (!ts.isObjectLiteralExpression(element)) {
      throw invalid(filePath, "data sources must be object literals");
    }

    return {
      columns: requiredStrings(element, "columns", filePath),
      table: requiredString(element, "table", filePath),
    };
  });

  if (new Set(sources.map(({ table }) => table)).size !== sources.length) {
    throw invalid(filePath, "decisions.data must contain unique tables");
  }

  return sources;
};

const sourceFile = (filePath: string, source: string): ts.SourceFile =>
  ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

const findCalls = (
  source: ts.SourceFile,
  matches: (call: ts.CallExpression) => boolean,
): ts.CallExpression[] => {
  const calls: ts.CallExpression[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && matches(node)) calls.push(node);
    ts.forEachChild(node, visit);
  };

  visit(source);
  return calls;
};

export const discoverRoute = (
  filePath: string,
  source: string,
): DiscoveredRoute => {
  const calls = findCalls(sourceFile(filePath, source), (call) => {
    if (!ts.isPropertyAccessExpression(call.expression)) return false;
    return (
      ts.isIdentifier(call.expression.expression) &&
      call.expression.expression.text === "fastify" &&
      (httpMethods.has(call.expression.name.text) ||
        call.expression.name.text === "route")
    );
  });

  if (calls.length !== 1) {
    throw invalid(
      filePath,
      `expected exactly one Fastify route declaration, found ${calls.length}`,
    );
  }

  const [call] = calls;
  if (call === undefined) {
    throw invalid(filePath, "route call was not found");
  }
  const routePath = call.arguments[0];

  if (!ts.isPropertyAccessExpression(call.expression)) {
    throw invalid(filePath, "the route declaration is unsupported");
  }

  if (call.expression.name.text === "route") {
    if (routePath === undefined || !ts.isObjectLiteralExpression(routePath)) {
      throw invalid(filePath, "fastify.route() needs an object literal");
    }

    return {
      method: requiredString(routePath, "method", filePath).toUpperCase(),
      routePath: requiredString(routePath, "url", filePath),
    };
  }

  if (routePath === undefined || !ts.isStringLiteralLike(routePath)) {
    throw invalid(filePath, "the route path must be a string literal");
  }

  return {
    method: call.expression.name.text.toUpperCase(),
    routePath: routePath.text,
  };
};

export const discoverRouteRegistrations = (
  filePath: string,
  source: string,
): DiscoveredRegistration[] => {
  const parsed = sourceFile(filePath, source);
  const routeImports = new Map<string, string>();

  for (const statement of parsed.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      continue;
    }

    const match = /^\.\/routes\/([^/]+)\.ts$/.exec(
      statement.moduleSpecifier.text,
    );
    const bindings = statement.importClause?.namedBindings;

    if (
      match === null ||
      bindings === undefined ||
      !ts.isNamedImports(bindings)
    ) {
      continue;
    }

    const routeStem = match[1];
    if (routeStem === undefined) continue;

    for (const element of bindings.elements) {
      routeImports.set(element.name.text, routeStem);
    }
  }

  const calls = findCalls(
    parsed,
    (call) =>
      ts.isIdentifier(call.expression) &&
      call.expression.text === "createApiRoutes",
  );

  if (calls.length !== 1) {
    throw invalid(
      filePath,
      `expected exactly one createApiRoutes() call, found ${calls.length}`,
    );
  }

  const [registrationCall] = calls;
  if (registrationCall === undefined) {
    throw invalid(filePath, "createApiRoutes() call was not found");
  }
  const registrations = registrationCall.arguments[0];

  if (
    registrations === undefined ||
    !ts.isArrayLiteralExpression(registrations)
  ) {
    throw invalid(filePath, "createApiRoutes() must receive an array literal");
  }

  return registrations.elements.map((element) => {
    if (!ts.isObjectLiteralExpression(element)) {
      throw invalid(filePath, "route registrations must be object literals");
    }

    const plugin = objectProperty(element, "plugin");

    if (plugin === undefined || !ts.isIdentifier(plugin)) {
      throw invalid(filePath, "each registration needs a plugin identifier");
    }

    const routeStem = routeImports.get(plugin.text);

    if (routeStem === undefined) {
      throw invalid(
        filePath,
        `${plugin.text} must be imported from ./routes/<route>.ts`,
      );
    }

    return {
      routeStem,
      surfaces: requiredStrings(element, "surfaces", filePath),
    };
  });
};

export const discoverEndpointContract = (
  filePath: string,
  source: string,
): DiscoveredEndpointContract => {
  const calls = findCalls(
    sourceFile(filePath, source),
    (call) =>
      ts.isIdentifier(call.expression) &&
      call.expression.text === "endpointContractChecks",
  );

  if (calls.length !== 1) {
    throw invalid(
      filePath,
      `expected exactly one endpointContractChecks() call, found ${calls.length}`,
    );
  }

  const [contractCall] = calls;
  if (contractCall === undefined) {
    throw invalid(filePath, "endpointContractChecks() call was not found");
  }
  const contract = contractCall.arguments[0];

  if (contract === undefined || !ts.isObjectLiteralExpression(contract)) {
    throw invalid(filePath, "endpointContractChecks() needs an object literal");
  }

  const decisions = requiredObject(contract, "decisions", filePath);

  return {
    decisions: {
      access: requiredString(decisions, "access", filePath),
      data: requiredDataSources(decisions, filePath),
      errors: requiredString(decisions, "errors", filePath),
      filters: requiredString(decisions, "filters", filePath),
      request: requiredString(decisions, "request", filePath),
      response: requiredString(decisions, "response", filePath),
    },
    method: requiredString(contract, "method", filePath).toUpperCase(),
    routePath: requiredString(contract, "routePath", filePath),
    surfaces: requiredStrings(contract, "surfaces", filePath),
  };
};

export const contractTestName = (routeFile: string): string =>
  `${path.basename(routeFile, ".ts")}.contract.test.ts`;
