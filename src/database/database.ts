const filesPath = __dirname + "/files";

export const data = [


    {
        id: 1,
        name: "test1",
        getFilePath: (fileName: string) => `${filesPath}/test1/${fileName}`
    },

    {
        id: 2,
        name: "test2",
        getFilePath: (fileName: string) => `${filesPath}/test2/${fileName}`
    }


]