import express from 'express'
import { getRecording } from './mergeVideos.js'
const app = express()

app.get('/:meetingId', async (req, res) => {
    const { meetingId } = req.params
    const { headers, statusCode, body } = await getRecording(meetingId)
    res.set(headers)
    res.status(statusCode).send({
        body
    })
})

app.listen(3000, () => {
    console.log("Server is up and running")
})