import AWS from 'aws-sdk';
import { config } from 'dotenv';
config()

const credentials = new AWS.Credentials({ accessKeyId: process.env.ACCESS_KEY_ID, secretAccessKey: process.env.SECRET_ACCESS })
AWS.config.update({ region: 'us-east-1' });
AWS.config.credentials = credentials;
const s3 = new AWS.S3();
export const getObjects = async (meetingId, files) => {
	const prefix = `${meetingId}/${files}`;
	const list = await new Promise((resolve, reject) => {
		try {
			let params = {
				Bucket: process.env.BUCKET_NAME,
				MaxKeys: 1000,
				Prefix: prefix,
				Delimiter: prefix,
			};
			const allKeys = [];

			const listAllKeys = () => {
				s3.listObjectsV2(params, function (err, data) {
					if (err) {
						reject(err);
					} else {
						var contents = data.Contents;
						contents.forEach(function (content) {
							allKeys.push(content.Key);
						});

						if (data.IsTruncated) {
							params.ContinuationToken = data.NextContinuationToken;
							listAllKeys();
						} else {
							resolve(allKeys);
						}
					}
				});
			};
			listAllKeys();
		} catch (e) {
			reject(e);
		}
	});

	return list;
};
