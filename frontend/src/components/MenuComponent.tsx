import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiChevronDown, HiMail, HiViewGrid } from "react-icons/hi";
import { cn } from "@/utils/cn";

type MenuItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: { key: string; label: string }[];
};

export default function MenuComponent() {
  const [openKeys, setOpenKeys] = useState<string[]>(["sub1"]);
  const navigate = useNavigate();
  const location = useLocation();

  const items: MenuItem[] = [
    {
      key: "sub1",
      label: "云平台亲和性调度可视化验证工具",
      icon: <HiMail />,
      children: [
        { key: "/page1", label: "Option 1" },
        { key: "/page2", label: "Option 2" },
      ],
    },
    {
      key: "sub2",
      label: "异构智能体云平台智能体存储与监测软件",
      icon: <HiViewGrid />,
      children: [
        { key: "/page3", label: "Option 3" },
        { key: "/page4", label: "Option 4" },
      ],
    },
  ];

  const toggleSubMenu = (key: string) => {
    setOpenKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const onClick = (key: string) => {
    console.log("navigate to>>>", key);
    navigate(key);
  };

  return (
    <div className="w-[350px] h-full bg-gradient-to-b from-black/90 to-black/70 backdrop-blur-xl pt-4 border-r border-white/10">
      <div className="space-y-1 px-3">
        {items.map((item: MenuItem) => (
          <div key={item.key}>
            {item.children ? (
              <div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleSubMenu(item.key)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all text-lg",
                    "hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20",
                    "text-gray-300 hover:text-white group"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl group-hover:text-blue-400 transition-colors">
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: openKeys.includes(item.key) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HiChevronDown className="text-gray-400" />
                  </motion.div>
                </motion.button>
                <AnimatePresence>
                  {openKeys.includes(item.key) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <motion.button
                            key={child.key}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onClick(child.key)}
                            className={cn(
                              "w-full text-left px-4 py-2 rounded-md transition-all text-base",
                              location.pathname === child.key
                                ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border-l-2 border-cyan-400"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                          >
                            {child.label}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onClick(item.key)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all group text-lg",
                  location.pathname === item.key
                    ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-400/50"
                    : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10"
                )}
              >
                <span className="text-xl group-hover:text-blue-400 transition-colors">
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </motion.button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
