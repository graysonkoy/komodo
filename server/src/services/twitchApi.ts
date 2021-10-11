import axios from "axios";

export async function getClipInfo(urls) {
    
    const slugs = urls.map(url => {
        if(!url.includes('https://www.twitch.tv/')) throw 'invalid clip url';
        return url.split('/').pop();
    })
    
    const request = await axios.get(`https://api.twitch.tv/helix/clips?id=${slugs}`, {
        headers: {
            Authorization: `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`,
            "Client-ID": `${process.env.TWITCH_CLIENT_ID}`,
        },
    });

    if(request.data.data.length !== urls.length) throw 'clip doesnt exist';
    return request.data.data;
}
