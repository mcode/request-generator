import React, {Component} from 'react';

export default class CheckBox extends Component {
    constructor(props){
        super(props);
        this.state={
            toggle: props.toggle
        };

    this.onInputChange = this.onInputChange.bind(this);

    }

    onInputChange(_event){
        this.setState({toggle: !this.state.toggle});
        this.props.updateCB(this.props.elementName, !this.state.toggle);
    }

    render() {
        const toggleClass = (this.state.toggle?"checkBoxClicked":"checkBox");
        const indicatorClass = this.state.toggle?"onOffActive":"onOff";
        return (
            <span>
            <button
            className={toggleClass +" btn-class btn " + this.props.extraClass}
            name={this.props.elementName}
            onClick={this.onInputChange}
            >{this.props.displayName} <span className={indicatorClass + " onOffState " + this.props.extraInnerClass} ></span></button>
            </span>
        )
    }
}
