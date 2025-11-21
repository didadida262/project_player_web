import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PathInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (path: string) => void;
  title?: string;
  placeholder?: string;
}

export const PathInputDialog: React.FC<PathInputDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "选择文件夹路径",
  placeholder = "请输入文件夹路径..."
}) => {
  const [path, setPath] = useState("F:\\RESP");

  const handleConfirm = () => {
    if (path.trim()) {
      onConfirm(path.trim());
      setPath("");
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-96 max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-[16px] font-semibold mb-4">{title}</h3>
            
            <div className="mb-4">
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-[14px] text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            <div className="text-[12px] text-gray-400 mb-4">
              示例路径：
              <br />
              Windows:{" "}
              <span
                className="cursor-pointer text-cyan-300 hover:underline"
                onClick={() => setPath("F:\\RESP")}
              >
                F:\RESP
              </span>
              <br />
              Mac/Linux:{" "}
              <span
                className="cursor-pointer text-cyan-300 hover:underline"
                onClick={() => setPath("/Users/miles_wang/Desktop")}
              >
                /Users/miles_wang/Desktop
              </span>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[12px] text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={!path.trim()}
                className="px-4 py-2 text-[12px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                确定
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
