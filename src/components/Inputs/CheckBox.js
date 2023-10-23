import React, {Component} from 'react';

export default class CheckBox extends Component {
    constructor(props){
        super(props);
        this.onInputChange = this.onInputChange.bind(this);
    }

    onInputChange(_event) {
        this.props.updateCB(this.props.elementName, !this.props.toggle);
    }

    render() {
        const toggleClass = (this.props.toggle ? 'checkBoxClicked' : 'checkBox');
        const indicatorClass = this.props.toggle ? 'onOffActive' : 'onOff';
        return (
            <span>
            <button
            className={toggleClass +' btn-class btn ' + this.props.extraClass}
            name={this.props.elementName}
            onClick={this.onInputChange}
            >{this.props.displayName} <span className={indicatorClass + ' onOffState ' + this.props.extraInnerClass}/></button>
            </span>
        );
    }
}
