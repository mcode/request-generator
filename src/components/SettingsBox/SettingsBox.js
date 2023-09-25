import React, { Component } from 'react';
import './SettingsBox.css';
import InputBox from '../Inputs/InputBox';
import CheckBox from '../Inputs/CheckBox';
import { headerDefinitions } from '../../util/data'

export default class SettingsBox extends Component {
    constructor(props) {
        super(props);
        this.updateCB = this.updateCB.bind(this);
    }

    componentDidMount() { }

    updateCB(elementName, value) {
        this.props.updateCB(elementName, value);
    }

    render() {
        const headers = Object.keys(headerDefinitions)
            .map(key => ({ ...headerDefinitions[key], key }))
            // Display the fields in descending order of type. If two fields are the same type, then sort by ascending order of display text.
            .sort((self, other) => -self.type.localeCompare(other.type) || self.display.localeCompare(other.display));
        
        return (
            <div>
                {headers.map(({ key, type, display }) => {
                    const value = this.props.state[key];
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