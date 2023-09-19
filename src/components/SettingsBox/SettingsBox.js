import React, { Component } from 'react';
import './SettingsBox.css';
import InputBox from '../Inputs/InputBox';
import CheckBox from '../Inputs/CheckBox';
export default class SettingsBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };

        this.updateCB = this.updateCB.bind(this);
    }

    componentDidMount(){

    }

    updateCB(elementName, value) {
        this.props.updateCB(elementName, value);
    }

    render() {
        const view = {
            alternativeTherapy: { display: "Alternative Therapy Cards Allowed", type: 'check' }, 
            baseUrl: { display: "Base Server", type: "input" },
            cdsUrl: { display: "REMS Admin", type: "input" },
            clearQuestionnaireResponses: { display: "Clear EHR QuestionnaireResponses", type: "button" },
            defaultUser: { display: "Default User", type: "input" },
            ehrUrl: { display: "EHR Server", type: "input" },
            includeConfig: { display: "Include Configuration in CRD Request", type: "check" },
            launchUrl: { display: "DTR Launch URL (QuestionnaireForm)", type: "input" },
            orderSelect: { display: "Order Select Rest End Point", type: "input" },
            orderSign: { display: "Order Sign Rest End Point", type: "input" },
            pimsUrl: { display: "PIMS Server", type: "input" },
            resetPims: { display: "Reset PIMS Database", type: "button" },
            resetRemsAdmin: { display: "Reset REMS-Admin Database", type: "button" },
            responseExpirationDays: { display: "In Progress Form Expiration Days", type: "input" },
            sendPrefetch: { display: "Send Prefetch", type: "check" },
            smartAppUrl: { display: "SMART App", type: "input" }
        }

        const headers = Object.keys(this.props.model)
            // Merge the model and the view for rendering
            .map(key => ({ ...this.props.model[key], ...view[key], key }))
            // Display the fields in descending order of type. If two fields are the same type, then sort by ascending order of display text.
            .sort((self, other) => -self.type.localeCompare(other.type) || self.display.localeCompare(other.display));
        
        return (
            <div>
                {headers.map(({ key, value, type, display }) => {
                    switch(type) {
                        case "input":
                            return <div key={key}>
                                <p className="setting-header">{display}</p>
                                <InputBox 
                                    extraClass = "setting-input"
                                    value = {value}
                                    updateCB = {this.updateCB}
                                    elementName = {key}/>
                            </div>
                        case "check":
                            return <div key={key}>
                                <p className="setting-header">{display}
                                <CheckBox
                                    extraClass = "setting-checkbox"
                                    extraInnerClass = "setting-inner-checkbox"
                                    toggle = {value}
                                    updateCB={this.updateCB}
                                    elementName = {key} />
                                    </p>
                                <p>&nbsp;</p>
                            </div>
                        case "button":
                            return <div key={key}>
                                <button className={"setting-btn btn btn-class"} onClick={value}>{display}</button>
                            </div>
                        default:
                            return <div key={key}><p className="setting-header">{display}</p></div>
         }
                    
     })}
            </div>

        )
    }
}