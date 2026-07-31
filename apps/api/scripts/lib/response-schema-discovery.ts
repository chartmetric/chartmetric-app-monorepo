import ts from "typescript";

export interface ApiResponseContract {
  mapperName: string;
  name: string;
}

const hasExportModifier = (node: ts.VariableStatement): boolean =>
  node.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
  ) === true;

const findMarkerImportNames = (sourceFile: ts.SourceFile): Set<string> =>
  new Set(
    sourceFile.statements
      .filter(ts.isImportDeclaration)
      .flatMap((declaration) => {
        const bindings = declaration.importClause?.namedBindings;

        return bindings !== undefined && ts.isNamedImports(bindings)
          ? bindings.elements
              .filter(
                (element) =>
                  (element.propertyName?.text ?? element.name.text) ===
                  "defineApiResponse",
              )
              .map((element) => element.name.text)
          : [];
      }),
  );

const invalidMarker = (filePath: string, reason: string): Error =>
  new Error(`${filePath} has an invalid defineApiResponse marker: ${reason}`);

export const discoverApiResponseContracts = (
  filePath: string,
  source: string,
): ApiResponseContract[] => {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const markerImportNames = findMarkerImportNames(sourceFile);
  const contracts: ApiResponseContract[] = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      markerImportNames.has(node.expression.text)
    ) {
      const declaration = node.parent;

      if (
        !ts.isVariableDeclaration(declaration) ||
        declaration.initializer !== node
      ) {
        throw invalidMarker(
          filePath,
          "the call must initialize a top-level exported const",
        );
      }

      const declarationList = declaration.parent;

      if (!ts.isVariableDeclarationList(declarationList)) {
        throw invalidMarker(
          filePath,
          "the call must initialize a top-level exported const",
        );
      }

      const statement = declarationList.parent;

      if (!ts.isVariableStatement(statement)) {
        throw invalidMarker(
          filePath,
          "the call must initialize a top-level exported const",
        );
      }

      if (
        !hasExportModifier(statement) ||
        (declarationList.flags & ts.NodeFlags.Const) === 0
      ) {
        throw invalidMarker(
          filePath,
          "the marker must be a top-level exported const",
        );
      }

      if (!ts.isIdentifier(declaration.name)) {
        throw invalidMarker(filePath, "the exported contract must have a name");
      }

      const contractName = declaration.name.text;

      if (!/^[A-Z][A-Za-z0-9]*$/.test(contractName)) {
        throw invalidMarker(
          filePath,
          `${contractName} must be a PascalCase contract name`,
        );
      }

      const [mapper] = node.arguments;

      if (
        node.arguments.length !== 1 ||
        mapper === undefined ||
        !ts.isIdentifier(mapper)
      ) {
        throw invalidMarker(
          filePath,
          `${contractName} must wrap one mapper identifier`,
        );
      }

      contracts.push({ mapperName: mapper.text, name: contractName });
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return contracts.sort((left, right) => left.name.localeCompare(right.name));
};
