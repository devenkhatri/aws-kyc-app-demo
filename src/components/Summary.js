import React, { useState, useEffect } from "react";
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Table from 'react-bootstrap/Table'

import { Auth, Logger } from 'aws-amplify'
import AWS from 'aws-sdk'
import awsConfig from "../aws-exports"

const logger = new Logger('kyc-summary', 'INFO');
AWS.config.update({ region: awsConfig.aws_cognito_region });


export default ({ setTabStatus, documentDetails, liveTestDetails }) => {

    const [faceSimilarity, setFaceSimilarity] = useState(-1)
    const [alertMessage, setAlertMessage] = useState("")

    useEffect(() => {

        Auth.currentCredentials().then(function (creds) {
            AWS.config.update(creds);
        })

    }, [])

    const compareFaces = async () => {

        let rekognition = new AWS.Rekognition();


        const sourceImage = liveTestDetails['liveImage']
        const sourceBase64Image = sourceImage && sourceImage.split(';base64,').pop();
        const sourceBinaryImg = new Buffer(sourceBase64Image, 'base64');

        const targetImage = documentDetails['userImage']
        const targetBase64Image = targetImage && targetImage.split(';base64,').pop();
        const targetBinaryImg = new Buffer(targetBase64Image, 'base64');


        let params = {
            SourceImage: {
                Bytes: sourceBinaryImg

            },
            TargetImage: {
                Bytes: targetBinaryImg
            },
            QualityFilter: 'NONE',
            SimilarityThreshold: 30
        };


        let compareFacesResponse = await rekognition.compareFaces(params).promise()
        if (compareFacesResponse.$response.error) {
            logger.info(compareFacesResponse.$response.error.message)
            setFaceSimilarity(-1)
            setAlertMessage(compareFacesResponse.$response.error.message)
        } else {
            logger.info('compare results', compareFacesResponse)

            if (compareFacesResponse.FaceMatches.length == 0) {
                setAlertMessage(" Did not pass Face similarity test. Try again !")
                setFaceSimilarity(0)
            }
            else {
                setFaceSimilarity(compareFacesResponse.FaceMatches[0].Similarity)
                if (compareFacesResponse.FaceMatches[0].Similarity > 80) {
                    setAlertMessage(" You have successfully completed the KYC")
                } else {
                    setAlertMessage(" Did not pass Face similarity test. Try again !")
                }
            }
            console.log("******* compareFacesResponse", compareFacesResponse)
        }

    }



    return (

        <div>
            <Table responsive>
                <tbody>
                    <tr>
                        <td>
                            <Card border="light">
                                <Card.Header>
                                    Liveness Test Data
                                </Card.Header>
                                <Card.Body>
                                    <Container>
                                        <Row>
                                            <Table responsive>
                                                <tbody>
                                                    <tr>
                                                        <td>Gender</td>
                                                        <td>{liveTestDetails["liveGender"]}</td>
                                                    </tr>

                                                    <tr>
                                                        <td>Live Image</td>
                                                        <td>
                                                            <img alt="Live snapshot" src={`${liveTestDetails['liveImage']}`} />
                                                        </td>
                                                    </tr>

                                                </tbody>
                                            </Table>

                                        </Row>
                                    </Container>
                                </Card.Body>

                            </Card>
                        </td>
                        <td>
                            <Card border="light">
                                <Card.Header>
                                    Data Extracted from ID documents.
                                </Card.Header>
                                <Card.Body>
                                    <Container>
                                        <Row>
                                            <Table responsive>
                                                <tbody>
                                                    <tr>
                                                        <td>Document Type</td>
                                                        <td>{documentDetails["documentType"]}</td>
                                                    </tr>

                                                    <tr>
                                                        <td>Name</td>
                                                        <td>{documentDetails["name"]}</td>
                                                    </tr>

                                                    <tr>
                                                        <td>Date of Birth</td>
                                                        <td>{documentDetails["dateOfBirth"]}</td>
                                                    </tr>

                                                    <tr>
                                                        <td>Gender</td>
                                                        <td>{documentDetails["gender"]}</td>
                                                    </tr>

                                                    <tr>
                                                        <td>Image</td>
                                                        <td>
                                                            <img alt="User from Document" src={`${documentDetails['userImage']}`} />
                                                        </td>
                                                    </tr>

                                                </tbody>
                                            </Table>

                                        </Row>
                                    </Container>
                                </Card.Body>
                            </Card>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="2">
                            <Card>
                                <Card.Header>
                                    Compare Faces to complete KYC
                                </Card.Header>
                                <Card.Body>

                                    {faceSimilarity === -1 && <Button variant="primary" onClick={compareFaces}>Compare Faces</Button>}

                                    {faceSimilarity !== -1 && <span>Face Similarity is <b> {Math.round(faceSimilarity, -2)}%  </b></span>}

                                    <span> {alertMessage} </span>

                                </Card.Body>
                            </Card>
                        </td>
                    </tr>
                </tbody>
            </Table>

        </div>
    )
};
