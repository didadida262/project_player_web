import { useResources, CategoryNode } from "../provider/resource-context";
import cn from "classnames";
import { getFiles } from "@/api/common";
import { isDirectory } from "../utils/mimeTypes";
import { useState, useCallback } from "react";
import { HiChevronRight, HiChevronDown } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

interface CategoryItemProps {
  item: any;
  level: number;
  onItemClick: (item: any) => Promise<void>;
  currentCate: any;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  children?: CategoryNode[];
}

function CategoryItem({ 
  item, 
  level, 
  onItemClick, 
  currentCate, 
  expandedPaths,
  onToggleExpand,
  children
}: CategoryItemProps) {
  const isExpanded = expandedPaths.has(item.path);
  const hasChildren = children && children.length > 0;
  const indent = level * 16;

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 点击图标时，只切换展开/折叠状态
    if (hasChildren) {
      onToggleExpand(item.path);
    }
  };

  const handleItemClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 执行点击逻辑（加载内容）
    await onItemClick(item);
  };

  const isSelected = currentCate?.path === item.path;

  return (
    <div>
      <div
        className={cn(
          "w-full min-h-[40px] text-[14px] flex items-center",
          "hover:bg-[#383b45] rounded-[4px] hover:cursor-pointer transition-colors",
          "border-b-[1px] border-solid border-[#383b45]",
          isSelected ? "bg-[#383b45]" : "",
        )}
        style={{ paddingLeft: `${10 + indent}px`, paddingRight: '10px' }}
      >
        {hasChildren ? (
          <motion.span 
            className="mr-2 flex items-center justify-center w-[16px] h-[16px] flex-shrink-0 cursor-pointer"
            onClick={handleIconClick}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <HiChevronRight className="text-gray-300 text-[14px]" />
          </motion.span>
        ) : (
          <span className="mr-2 w-[16px] flex-shrink-0" />
        )}
        <span 
          className="flex-1 truncate text-gray-200"
          onClick={handleItemClick}
        >
          {item.name.length > 20 ? item.name.slice(0, 20) + "..." : item.name}
        </span>
      </div>
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            className="ml-0"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.25, 
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.2 }
            }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex flex-col gap-y-2 pt-2 pb-1">
              {children.map((child, index) => (
                <motion.div
                  key={`${child.path}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.2, 
                    delay: index * 0.03,
                    ease: "easeOut"
                  }}
                >
                  <CategoryItem
                    item={child}
                    level={level + 1}
                    onItemClick={onItemClick}
                    currentCate={currentCate}
                    expandedPaths={expandedPaths}
                    onToggleExpand={onToggleExpand}
                    children={child.children}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CategoryContainer() {
  const { 
    categories, 
    setSourcelist, 
    currentCate, 
    setCurrentCate, 
    setCurrentFile, 
    setcurrentfileurl,
    categoryTree,
    setCategoryTree,
    expandedPaths,
    setExpandedPaths
  } = useResources();

  const handleClick = useCallback(async (file: any) => {
    // 清空当前播放的文件和URL
    setCurrentFile({});
    setcurrentfileurl('');
    
    setCurrentCate(file);
    const params = {
      path: file.path,
    };
    
    try {
      const res = (await getFiles(params)) as any;
      
      if (!res || res.length === 0) {
        setSourcelist([]);
        // 如果目录为空，清除该路径的子节点
        const newTree = new Map(categoryTree);
        newTree.set(file.path, []);
        setCategoryTree(newTree);
        return;
      }

      // 判断是否所有文件都是文件夹
      const allAreFolders = res.every((item: any) => isDirectory(item.type));
      
      if (allAreFolders) {
        // 如果都是文件夹，在左侧显示子文件夹（树形结构）
        const folderNodes: CategoryNode[] = res.map((item: any) => ({
          name: item.name,
          path: item.path,
          type: item.type,
          allChildrenAreFolders: undefined, // 将在点击时确定
        }));
        
        // 更新树形结构
        const newTree = new Map(categoryTree);
        const alreadyHasChildren = newTree.has(file.path);
        newTree.set(file.path, folderNodes);
        setCategoryTree(newTree);
        
        // 只有在第一次加载时才自动展开（如果之前没有子节点）
        if (!alreadyHasChildren) {
          setExpandedPaths((prev) => {
            const newSet = new Set(prev);
            newSet.add(file.path);
            return newSet;
          });
        }
        
        // 清空右侧文件列表
        setSourcelist([]);
      } else {
        // 如果不是全部都是文件夹，在右侧显示文件列表
        setSourcelist(res);
        
        // 清除该路径的子节点（因为不是全部都是文件夹，所以不在左侧显示）
        const newTree = new Map(categoryTree);
        newTree.delete(file.path);
        setCategoryTree(newTree);
        
        // 自动播放第一个文件（如果不是文件夹）
        const firstNonFolder = res.find((item: any) => !isDirectory(item.type));
        if (firstNonFolder) {
          setCurrentFile(firstNonFolder);
        }
      }
    } catch (error) {
      console.error('获取文件列表失败:', error);
      setSourcelist([]);
    }
  }, [setSourcelist, setCurrentCate, setCurrentFile, setcurrentfileurl, categoryTree, setCategoryTree, setExpandedPaths]);

  const handleToggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, [setExpandedPaths]);

  // 过滤出只有文件夹的项（一级目录）
  const folderItems = categories.filter((item: any) => {
    const isDir = isDirectory(item.type);
    return isDir;
  });

  return (
    <div className="w-full h-full px-[8px] py-[8px] flex flex-col justify-start gap-y-2 overflow-y-auto">
      {folderItems.map((item: any, index: number) => {
        const children = categoryTree.get(item.path);
        return (
          <CategoryItem
            key={`${item.path}-${index}`}
            item={item}
            level={0}
            onItemClick={handleClick}
            currentCate={currentCate}
            expandedPaths={expandedPaths}
            onToggleExpand={handleToggleExpand}
            children={children}
          />
        );
      })}
    </div>
  );
}