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

export const getRecording = async (meetingId) => {

	const list = await getObjects(meetingId, 'audio');
	console.log("List is ", list)
	try {
		await mkdir('./temp')
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
			writePromises.push(writeFile(`./temp/${list[i].split('audio/')[1]}`, ele.Body))
		})
		await Promise.all(writePromises)

		const fileDir = await readdir('./temp')
		let videoMerger = ffmpeg()
		fileDir.forEach((ele) => {
			videoMerger = videoMerger.input(`./temp/${ele}`)
		})

		const merge = new Promise((fulfilled, rejected) => {
			videoMerger.mergeToFile(`./output.mp4`)
				.on('error', function (err) {
					console.log('Error ' + err.message);
				})
				.on('end', function () {
					fulfilled()
				});
		})

		await merge;

		const outputFile = await readFile('./output.mp4')
		const params = {
			Bucket: process.env.BUCKET_NAME,
			Key: `${meetingId}/recording.mp4`,
			Body: outputFile,
		};
		await s3.putObject(params).promise()

		await rm('./temp', { recursive: true })
		await unlink('./output.mp4')

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
