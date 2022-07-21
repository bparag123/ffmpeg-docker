import express from 'express'
import { getRecording } from './mergeVideos.js'
const app = express()

app.get('/:meetingId',async (req, res) => {
    const { meetingId } = req.params
    const result = await getRecording(meetingId)
    res.send(result)
})

app.listen(3000, () => {
    console.log("Server is up and running")
})