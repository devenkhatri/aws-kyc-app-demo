import React, { useState, useEffect } from "react";
import Webcam from "react-webcam";
import Button from 'react-bootstrap/Button'
import gest_data from './gestures.json'
import Card from "react-bootstrap/Card"
import ProgressBar from "react-bootstrap/ProgressBar"
import _ from 'lodash'
import { Auth, Logger } from "aws-amplify";
import AWS from 'aws-sdk'
import awsConfig from "../aws-exports"
import 'jimp';
const { Jimp } = window;

const logger = new Logger('kyc', 'INFO');
AWS.config.update({ region: awsConfig.aws_cognito_region });


const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
};

const Liveliness = ({ setTabStatus, setLiveTestDetails }) => {
    const [gesture, setGesture] = useState(null);
    const [showSpinner, setShowSpinner] = useState(false);
    const [alertMessage, setAlertMessage] = useState("You will be asked to do a series of random gestures which will enable us to detect a live feed.  ");
    const [showProgress, setShowProgress] = useState(false);
    const [showWebcam, setShowWebcam] = useState(false);
    const [progressValue, setProgressValue] = useState(5);

    // identification state from liveness test
    const [liveGender, setLiveGender] = useState("");
    const [ageRange, setAgeRange] = useState("");
    const [liveImage, setLiveImage] = useState(null);

    useEffect(() => {
        Auth.currentCredentials().then(function (creds) {
            AWS.config.update(creds);
        })
    }, [])

    useEffect(() => {
        if (gesture !== null) {
            const description = getGestureDescription(gesture)
            setAlertMessage(description + ". Click button to continue =>  ")
        }

    }, [gesture])

    const getGestureDescription = (gesture) => {
        return _.find(gest_data, function (gest) {
            return gest.name === gesture;
        }).description
    }

    const proceedToNext = () => {
        setLiveTestDetails({
            liveGender: liveGender,
            ageRange: ageRange,
            liveImage: liveImage
        })
        setTabStatus("UploadDocs");
    }

    const updateGestureState = () => {        

        // update current gesture state to true
        // update next gesture
        if (gesture === "lookRight") {
            setProgressValue(25)
            setGesture("lookLeft")
        }
        else if (gesture === "lookLeft") {
            setProgressValue(50)
            setGesture("smile")
        }
        else if (gesture === "smile") {
            setProgressValue(75)
            setGesture("mouthOpen")
        } else {
            setProgressValue(100)
            setShowWebcam(false);
        }
    }

    const validateGesture = (gesture, data) => {
        logger.info("Validating gesture", data);
        if (data.length === 0) {
            // more than one face
            return { result: false, message: "Could not recognize a face. Try again " }
        }

        if (data.length > 1) {
            // more than one face
            return { result: false, message: "More than one face. Try again " }
        }
        logger.info(data.FaceDetails[0])

        if (gesture === "lookRight") {
            if (data.FaceDetails[0].Pose.Yaw <= -30) {
                return { result: true, message: "Thank you" }
            } else {
                return { result: false, message: "Failed to validate face turning right. Try again " }
            }
        }
        else if (gesture === "lookLeft") {
            if (data.FaceDetails[0].Pose.Yaw >= 30) {
                return { result: true, message: "Thank you" }
            } else {
                return { result: false, message: "Failed to validate face turning left. Try again " }
            }
        } else if (gesture === "smile") {

            if (data.FaceDetails[0].Smile.Value === true) {
                return { result: true, message: "Thank you" }
            } else {
                return { result: false, message: "Failed to validate smile. Try again " }
            }

        } else if (gesture === "mouthOpen") {
            if (data.FaceDetails[0].MouthOpen.Value === true) {
                return { result: true, message: "You can successfully completed Liveness checks !! " }
            } else {
                return { result: false, message: "Failed to validate open mouth. Try again " }
            }
        }

        return { result: false, message: "Unkown gesture type specified" }
    }

    const requestGesture = async () => {


        setShowSpinner(true);

        const imageBase64String = webcamRef.current.getScreenshot({ width: 800, height: 450 });
        const base64Image = imageBase64String && imageBase64String.split(';base64,').pop();
        const imageBuffer = new Buffer(base64Image, 'base64');

        let rekognition = new AWS.Rekognition();
        let params = {
            Attributes: ["ALL"],
            Image: {
                Bytes: imageBuffer
            }
        };

        let faceDetectResponse = await rekognition.detectFaces(params).promise()

        if (faceDetectResponse.$response.error) {
            setShowSpinner(false);
            setAlertMessage(faceDetectResponse.$response.error.message)
            return new Promise((resolve, reject) => {
                throw new Error(faceDetectResponse.$response.error.message);
            })
        }
        else {
            let validationResult = validateGesture(gesture, faceDetectResponse)
            if (validationResult.result) {
                if (gesture === 'smile') {

                    // set the gender
                    setLiveGender(faceDetectResponse.FaceDetails[0].Gender.Value)
                    setAgeRange(faceDetectResponse.FaceDetails[0].AgeRange.Value)

                    // get the bounding box
                    let imageBounds = faceDetectResponse.FaceDetails[0].BoundingBox
                    logger.info("****** faceDetectResponse", faceDetectResponse)
                    logger.info(imageBounds)
                    // crop the face and store the image
                    Jimp.read(imageBuffer, (err, image) => {
                        if (err) throw err;
                        else {
                            image.crop(image.bitmap.width * imageBounds.Left - 15, image.bitmap.height * imageBounds.Top - 15, image.bitmap.width * imageBounds.Width + 30, image.bitmap.height * imageBounds.Height + 30)
                                .getBase64(Jimp.MIME_JPEG, function (err, base64Image) {
                                    setLiveImage(base64Image)
                                })
                        }
                    })

                    // update gesture state
                    setAlertMessage(validationResult.message)
                    setShowSpinner(false);
                    updateGestureState();
                } else {
                    // update gesture state
                    setAlertMessage(validationResult.message)
                    setShowSpinner(false);
                    updateGestureState();
                }
                console.log("******* gesture, progress", gesture, progressValue)
            } else {
                // unable to validate gesture - set Error Message
                setAlertMessage(validationResult.message)
                setShowSpinner(false);
            }
        }
    }

    function start_test(evt) {
        setShowProgress(true);
        setShowWebcam(true);
        setGesture("lookRight")
    }

    const webcamRef = React.useRef(null);


    return (
        <>
            <Card>
                <Card.Header>
                    {alertMessage}
                    {!showProgress && <Button variant="primary" onClick={start_test}>Start</Button>}
                    {showProgress && progressValue < 100 && <Button variant="primary" onClick={requestGesture}>Validate</Button>}
                    {progressValue === 100 && <Button variant="primary" onClick={proceedToNext}>Continue</Button>}
                </Card.Header>

                <Card.Body>
                    {showSpinner && <div className="spinner" ></div>}
                    {showWebcam && <div className="video-padding">
                        <Webcam
                            audio={false}
                            height={450}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            width={800}
                            videoConst
                            raints={videoConstraints}
                        />

                    </div>
                    }

                    {showProgress && <div className="live-progressbar"><ProgressBar now={progressValue} label={`${progressValue}%`} /></div>}

                </Card.Body>
            </Card>
        </>
    );
};

export default Liveliness;