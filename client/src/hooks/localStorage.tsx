
export const getValue = (keyName: string | "", defaultValue: any) => {
    try {
        const value = window.localStorage.getItem(keyName);
        if (value) {
            return JSON.parse(value);
        }
    } catch (err) {
        return defaultValue;
    }
}

export const setValue = (keyName: string, newValue: string | undefined) => {
    try {
        window.localStorage.setItem(keyName, JSON.stringify(newValue));
    } catch (err) {
        console.log(err);
    }
};

export const setUser = (value: string | undefined) => {
    setValue("userLocal", value)
}

export const getUser = () => {
    return getValue("userLocal", undefined)
}

export const setStoredRepoFiles = (repoName: string | undefined, value: any) => {
    setValue(`repo_${repoName}`, value)
}

export const getStoredRepoFiles = (repoName: string) => {
    return getValue(`repo_${repoName}`, [])
}

export const setStoredRepoList = (username: string | undefined, value: any) => {
    setValue(`repo_list_user_${username}`, value)
}

export const getStoredRepoList = (username: string | undefined) => {
    return getValue(`repo_list_user_${username}`, [])
}