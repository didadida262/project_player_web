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
import { MenuList } from "@/components/Menu/const";

type MenuItem = Required<MenuProps>["items"][number];

export default function MenuComponent() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const onClick = (item: any) => {
    console.log("item>>>", item);
    navigate(item.key);
  };
  return (
    <div className="w-[350px] h-full bg-[black] pt-common">
      <Menu
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={MenuList.map((menu) => menu.key)}
        mode="inline"
        theme="dark"
        items={MenuList}
        onClick={onClick}
      />
    </div>
  );
}
