import { type FC, useState } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";

import { Layout } from "./layout/Layout";
import { AccountPage } from "./pages/account/AccountPage";
import { InfluencersPage } from "./pages/creators/influencers/InfluencersPage";
import { DemoPage } from "./pages/demo/DemoPage";
import { ArtistsPage } from "./pages/music/artists/ArtistsPage";
import { AthletesPage } from "./pages/sports/athletes/AthletesPage";
import { DEFAULT_VERTICAL } from "./verticals";

const routes = [
  {
    children: [
      {
        element: <Navigate replace to={DEFAULT_VERTICAL.homePath} />,
        index: true,
      },
      { element: <ArtistsPage />, path: "/music/artists" },
      { element: <AthletesPage />, path: "/sports/athletes" },
      { element: <InfluencersPage />, path: "/creators/influencers" },
      { element: <DemoPage />, path: "/demo" },
      { element: <AccountPage />, path: "/account" },
      {
        element: <Navigate replace to={DEFAULT_VERTICAL.homePath} />,
        path: "*",
      },
    ],
    element: <Layout />,
  },
];

export const App: FC = () => {
  const [router] = useState(() => createBrowserRouter(routes));

  return <RouterProvider router={router} />;
};
