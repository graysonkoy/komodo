import path from 'path';
import YoutubeDlWrap from 'youtube-dl-wrap'

const binary = path.join(__dirname, 'youtube-dl.exe')
const youtubeDlWrap = new YoutubeDlWrap(binary);

export async function getVideo(url, slug) {


    const outputPath = path.join(__dirname, `../downloaded/${slug}.mp4`)
    
    try { 
        const file = await youtubeDlWrap.execPromise([url, '-o', outputPath], { writeInfoJson: true }) 
        return file
    }
    catch(error) { console.log(error)}
}