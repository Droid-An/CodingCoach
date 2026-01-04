export const getGithubToken = async (user_id: string | undefined) => {
    const response = await fetch('https://dev-3gneykmd0foohzrw.us.auth0.com/api/v2/users/' + user_id, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + import.meta.env.VITE_AUTH0_KEY,
        },
    });

    const data = await response.json();


    for (const identity of data.identities) {
        if (identity.provider === 'github') {
            return identity.access_token;
        }
    }
}