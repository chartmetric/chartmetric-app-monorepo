import type { MessageDescriptor } from "@lingui/core";
import type { FC } from "react";

import { msg } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import { Alert, Badge, Code, Group, Loader, Table, Text } from "@mantine/core";

import {
  type AccountRole,
  type ProductAccess,
  useAccessContext,
} from "../hooks/useAccessContext";

const ROLE_LABELS: Record<AccountRole, MessageDescriptor> = {
  admin: msg`Admin`,
  analyst: msg`Analyst`,
  owner: msg`Owner`,
};

interface ProductsTableProps {
  products: Record<string, ProductAccess>;
}

const ProductsTable: FC<ProductsTableProps> = ({ products }) => {
  const { t } = useLingui();

  return (
    <Table.ScrollContainer minWidth={420}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Trans>Product</Trans>
            </Table.Th>
            <Table.Th>
              <Trans>Access</Trans>
            </Table.Th>
            <Table.Th>
              <Trans>Features</Trans>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Object.entries(products).map(([productId, access]) => (
            <Table.Tr key={productId}>
              <Table.Td>
                <Code>{productId}</Code>
              </Table.Td>
              <Table.Td>
                <Badge color={access.enabled ? "teal" : "gray"} variant="light">
                  {access.enabled ? t`Enabled` : t`Disabled`}
                </Badge>
              </Table.Td>
              <Table.Td>
                {access.features === undefined ? (
                  <Text c="dimmed" size="sm">
                    —
                  </Text>
                ) : (
                  <Code block>{JSON.stringify(access.features)}</Code>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};

export interface AccessSummaryProps {
  accessToken: string;
  userId: string;
}

export const AccessSummary: FC<AccessSummaryProps> = ({
  accessToken,
  userId,
}) => {
  const { t } = useLingui();
  const accessQuery = useAccessContext(userId, accessToken);

  if (accessQuery.isPending) {
    return <Loader aria-label={t`Loading access details`} size="sm" />;
  }

  if (accessQuery.isError) {
    return (
      <Alert color="red" title={t`Could not load your access details`}>
        {accessQuery.error.message === "no_org_membership" ? (
          <Trans>Your user does not belong to an organization yet.</Trans>
        ) : (
          <Trans>Try again in a moment or contact support.</Trans>
        )}
      </Alert>
    );
  }

  const { account, products } = accessQuery.data;

  return (
    <>
      <Group gap="xl">
        <div>
          <Text c="dimmed" size="sm">
            <Trans>Account ID</Trans>
          </Text>
          <Code>{account.id}</Code>
        </div>
        <div>
          <Text c="dimmed" size="sm">
            <Trans>Role</Trans>
          </Text>
          <Badge variant="light">{t(ROLE_LABELS[account.role])}</Badge>
        </div>
      </Group>
      <div>
        <Text c="dimmed" size="sm">
          <Trans>Products</Trans>
        </Text>
        <ProductsTable products={products} />
      </div>
    </>
  );
};
