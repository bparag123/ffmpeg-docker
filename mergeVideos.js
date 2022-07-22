import AWS from 'aws-sdk';
import { getObjects } from './ListObjects.js';
import { config } from 'dotenv'
config()

const credentials = new AWS.Credentials({ accessKeyId: process.env.ACCESS_KEY_ID, secretAccessKey: process.env.SECRET_ACCESS })

AWS.config.update({ region: 'us-east-1' });
AWS.config.credentials = credentials;

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
import { mkdir, readFile } from 'fs/promises'
import { writeFile, readdir, rmdir, unlink, rm } from 'fs/promises'
import ffmpeg from "fluent-ffmpeg"
import { v4 as uuid } from 'uuid'

export const getRecording = async (meetingId) => {

	const list = await getObjects(meetingId, 'audio');
	console.log("List is ", list)
	const id = uuid()
	const tempDir = `./${id}`
	const outputFile = `${tempDir}/output.mp4`
	console.log(tempDir)
	console.log(outputFile)
	try {
		await mkdir(`./${tempDir}`)
	} catch (error) {

	}
	if (list.length > 0) {
		const promises = []
		for (let i = 0; i < list.length; i++) {
			const params = {
				Bucket: process.env.BUCKET_NAME,
				Key: list[i],
			};
			promises.push(s3.getObject(params).promise());
		}
		const results = await Promise.all(promises);
		console.log(results)
		const writePromises = []
		results.map((ele, i) => {
			writePromises.push(writeFile(`${tempDir}/${list[i].split('audio/')[1]}`, ele.Body))
		})
		await Promise.all(writePromises)

		const fileDir = await readdir(tempDir)
		let videoMerger = ffmpeg()
		fileDir.forEach((ele) => {
			videoMerger = videoMerger.input(`${tempDir}/${ele}`)
		})

		const merge = new Promise((fulfilled, rejected) => {
			videoMerger.mergeToFile(outputFile)
				.on('error', function (err) {
					console.log('Error ' + err.message);
				})
				.on('end', function () {
					fulfilled()
				});
		})

		await merge;

		const outputFileData = await readFile(outputFile)
		console.log(outputFileData)
		const params = {
			Bucket: process.env.BUCKET_NAME,
			Key: `${meetingId}/recording.mp4`,
			Body: outputFileData,
		};
		await s3.putObject(params).promise()

		console.log("Uploaded To S3")

		await rm(`${tempDir}`, { recursive: true })

		console.log("Completed...")

		return {
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Methods': '*',
				'Access-Control-Allow-Origin': '*',
			},
			statusCode: 200,
			body: JSON.stringify({ message: 'Generated recording file' }),
		};
	} else {
		return {
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Methods': '*',
				'Access-Control-Allow-Origin': '*',
			},
			statusCode: 200,
			body: JSON.stringify({
				message: `No Meeting found with Id ${meetingId}`,
			}),
		};
	}
};
