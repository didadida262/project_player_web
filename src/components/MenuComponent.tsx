import type { MenuProps } from "antd";
import { Button, Menu } from "antd";
import { useState } from "react";

import {
  AppstoreOutlined,
  ContainerOutlined,
  DesktopOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

type MenuItem = Required<MenuProps>["items"][number];

export default function MenuComponent() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const items: MenuItem[] = [
    {
      key: "sub1",
      label: "云平台亲和性调度可视化验证工具",
      icon: <MailOutlined />,
      children: [
        { key: "/page1", label: "Option 1" },
        { key: "/page2", label: "Option 2" },
      ],
    },
    {
      key: "sub2",
      label: "异构智能体云平台智能体存储与监测软件",
      icon: <AppstoreOutlined />,
      children: [
        { key: "/page3", label: "Option 3" },
        { key: "/page4", label: "Option 4" },
      ],
    },
  ];

  const onClick = (item: any) => {
    console.log("item>>>", item);
    navigate(item.key);
  };
  return (
    <div className="w-[350px] h-full bg-[black] pt-common">
      <Menu
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={["sub1"]}
        mode="inline"
        theme="dark"
        items={items}
        style={{ fontSize: "18px" }}
        onClick={onClick}
      />
    </div>
  );
}
