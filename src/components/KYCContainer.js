import React, { useState } from 'react'

import Navbar from 'react-bootstrap/Navbar'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Button from 'react-bootstrap/Button'
import { useAuthenticator } from '@aws-amplify/ui-react';

import Liveliness from './Liveliness'
import AnalyzeDocs from './AnalyzeDocs'
import Summary from './Summary'

const KYCContainer = () => {

    const { user, signOut } = useAuthenticator((context) => [context.user]);
    const [currentTabKey, setCurrentTabKey] = useState("welcome");

    const [liveTestDetails, setLiveTestDetails] = useState({});
    const [documentDetails, setDocumentDetails] = useState({});

    const startKyc = () => {
        setCurrentTabKey("Liveliness");

    }

    const onSelectTab = (eventkey) => {
        console.log("printing event key ", eventkey);
        setCurrentTabKey(eventkey);
    }

    const setTabStatus = (value) => {
        console.log("current tab value ", value);
        setCurrentTabKey(value);
    }

    return (
        <div>
            <Container>
                <Row>
                    <Col>
                        <Navbar expand="lg" bg="dark" variant="dark">
                            <Navbar.Brand href="#"><h2 className="app-title">Video KYC</h2></Navbar.Brand>
                            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                            <Navbar.Collapse id="responsive-navbar-nav" className="justify-content-end">
                                <span className="logout">
                                    <Navbar.Brand>{user.username}</Navbar.Brand>
                                    <Button onClick={signOut}>
                                        SignOut
                                    </Button>
                                </span>
                            </Navbar.Collapse>
                        </Navbar>
                    </Col>
                </Row>
                <Row><Col><br></br></Col></Row>
                <Row>
                    <Col>
                        <Tabs defaultActiveKey={currentTabKey} activeKey={currentTabKey} id="uncontrolled-tab-example" onSelect={onSelectTab}>
                            <Tab eventKey="welcome" title="Welcome">
                                <h2>Welcome to video KYC</h2>
                                <div>
                                    <p>The KYC process consists of 3 simple steps. </p>
                                    <ul>
                                        <li>Liveliness Detection - The user will do a series of face gestures to determine whether its a live feed</li>
                                        <li>Upload Documents - upload valid ID documents to use for verification.</li>
                                        <li>Validation and summary</li>
                                    </ul>
                                </div>
                                <p>
                                    <Button variant="primary" onClick={startKyc}>Start</Button>
                                </p>
                            </Tab>
                            <Tab eventKey="Liveliness" title="Liveliness Test" disabled>
                                <div>
                                    <Liveliness setTabStatus={setTabStatus} setLiveTestDetails={setLiveTestDetails} />
                                </div>
                            </Tab>
                            <Tab eventKey="UploadDocs" title="Upload Documents" disabled>
                                <div>
                                    <AnalyzeDocs setTabStatus={setTabStatus} setDocumentDetails={setDocumentDetails} />
                                </div>
                            </Tab>
                            <Tab eventKey="AnalysisDetails" title="Details of Analysis" disabled>
                                <Summary setTabStatus={setTabStatus} documentDetails={documentDetails} liveTestDetails={liveTestDetails} />
                            </Tab>
                        </Tabs>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default KYCContainer;