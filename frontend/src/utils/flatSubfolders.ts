/** 仅该目录的子文件夹平铺到右侧，不在左侧树下展开 */
export const FLAT_SUBFOLDERS_DIR = "cate_p";

export function isFlatSubfoldersDir(name?: string | null) {
  return name === FLAT_SUBFOLDERS_DIR;
}
