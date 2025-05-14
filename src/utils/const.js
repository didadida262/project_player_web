/*
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐│
 *  ││Esc│!1 │@2 │#3 │$4 │%5 │^6 │&7 │*8 │(9 │)0 │_- │+= │|\ │`~ ││
 *  │├───┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴───┤│
 *  ││ Tab │ Q │ W │ E │ R │ T │ Y │ U │ I │ O │ P │{[ │}] │ BS  ││
 *  │├─────┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴─────┤│
 *  ││ Ctrl │ A │ S │ D │ F │ G │ H │ J │ K │ L │: ;│" '│ Enter  ││
 *  │├──────┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴────┬───┤│
 *  ││ Shift  │ Z │ X │ C │ V │ B │ N │ M │< ,│> .│? /│Shift │Fn ││
 *  │└─────┬──┴┬──┴──┬┴───┴───┴───┴───┴───┴──┬┴───┴┬──┴┬─────┴───┘│
 *  │      │Fn │ Alt │         Space         │ Alt │Win│   HHKB   │
 *  │      └───┴─────┴───────────────────────┴─────┴───┘          │
 *  └─────────────────────────────────────────────────────────────┘
 * 
 * @Author: Hhvcg
 * @Date: 2022-10-23 14:27:49
 * @LastEditors: Hhvcg
 */


const { getFiles } = require('./weapons')
export const respPath = 'F:\\RESP'

// 视频目录
export const CATEGORIES_A = getFiles(respPath).map((cate) => {
    return {
        key: cate,
        path: respPath + '\\' + cate
    }
})

// 获取music文件夹
const CATEGORIES_music = getFiles(respPath + '\\cate_3').map((cate) => {
    return {
        key: cate,
        path: respPath + '\\cate_3\\' + cate
    }
})

export const CATEGORIES = [...CATEGORIES_A]


// 高等权限
const hideRights = ['cate_3', 'cate_p', 'cate_g',]

// const CATEGORIES = {
//     Mv: {
//         path: respPath + '音乐\\点歌台\\',
//     },
//     Time: {
//         path: respPath + 'Time\\',
//     },
//     Interesting: {
//         path: respPath + '新建文件夹\\',
//     },

// }
// module.exports = {
//     CATEGORIES,
//     respPath,
//     CATEGORIES_music,
//     hideRights
// }