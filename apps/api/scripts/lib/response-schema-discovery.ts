import ts from "typescript";

const hasExportModifier = (node: ts.TypeAliasDeclaration): boolean =>
  node.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
  ) === true;

const isReturnType = (node: ts.TypeNode): boolean => {
  if (
    !ts.isTypeReferenceNode(node) ||
    !ts.isIdentifier(node.typeName) ||
    node.typeName.text !== "ReturnType"
  ) {
    return false;
  }

  const [typeArgument] = node.typeArguments ?? [];
  return typeArgument !== undefined && ts.isTypeQueryNode(typeArgument);
};

const isMapperReplyType = (node: ts.TypeNode): boolean => {
  if (isReturnType(node)) {
    return true;
  }

  if (
    !ts.isTypeReferenceNode(node) ||
    !ts.isIdentifier(node.typeName) ||
    node.typeName.text !== "Awaited"
  ) {
    return false;
  }

  const [typeArgument] = node.typeArguments ?? [];
  return typeArgument !== undefined && isReturnType(typeArgument);
};

export const discoverMapperReplyTypes = (
  filePath: string,
  source: string,
): string[] => {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const replies = sourceFile.statements
    .filter(ts.isTypeAliasDeclaration)
    .filter(hasExportModifier)
    .filter((declaration) => declaration.name.text.endsWith("Reply"));

  const invalidReplies = replies.filter(
    (declaration) => !isMapperReplyType(declaration.type),
  );

  if (invalidReplies.length > 0) {
    const invalidReplyNames = invalidReplies
      .map((declaration) => declaration.name.text)
      .join(", ");

    throw new Error(
      `${filePath} must define ${invalidReplyNames} with ReturnType<typeof mapper> or Awaited<ReturnType<typeof mapper>>`,
    );
  }

  if (replies.length === 0) {
    throw new Error(
      `${filePath} must export at least one *Reply type inferred from a mapper`,
    );
  }

  return replies.map((declaration) => declaration.name.text).sort();
};
