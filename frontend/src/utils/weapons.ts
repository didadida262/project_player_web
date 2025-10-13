// const fs = require('fs');

// export const scanAllDirs = (basePath: string) => {
//     fs.readdirSync(basePath, {withFileTypes: true}, (error: any, data: any) => {
//         const validDirs = data.filter((item: any) => !item.isFile()) 
//         return validDirs
//     })
// }


export const getRandomNum = (len: number) => {
    return Math.floor(Math.random() * len);
}
export const predealVideoName = (name: String) => {
    // let result = name.match(/[(]P(.*)\-/)
    let result = name.match(/[(]P(.*)/)
    if (result && result[1]) {
        return result[1]
    } else {
        return name
    }
}

export const getVideoID = (name: string) => {
    return Number(name.split('.')[0])
}