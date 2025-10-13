import {
  HiDatabase,
  HiDocumentText,
  HiHome,
  HiClock,
} from "react-icons/hi";

export const MenuList = [
  {
    key: "/",
    label: "首页",
    icon: <HiHome />,
  },

  {
    key: "/dispatch",
    label: "调度数据可视化展示",
    icon: <HiDatabase />,
    children: [
      { key: "dispatch/static", label: "静态调度" },
      { key: "/dispatch/dynamic", label: "动态调度" },
      { key: "/dispatch/intelinteraction", label: "智能体交互" },
    ],
  },

  {
    key: "/modeltrain",
    label: "模型训练",
    icon: <HiDocumentText />,
    children: [
      { key: "/traindata", label: "训练数据" },
      { key: "/traintasks", label: "训练任务" },
    ],
  },
  {
    key: "/history",
    label: "历史数据",
    icon: <HiClock />,
    children: [
      { key: "/nodecpu", label: "节点CPU" },
      { key: "/nodegpu", label: "节点GPU" },
    ],
  },
];
