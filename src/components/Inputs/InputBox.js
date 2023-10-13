import React, {Component} from 'react';


export default class InputBox extends Component {
    constructor(props){
        super(props);
        this.onInputChange = this.onInputChange.bind(this);
    }

    onInputChange(event){
        this.props.updateCB(this.props.elementName, event.target.value);
    }

    render() {
        return (
            <div>
            <input
            className={"form-control input-text " + this.props.extraClass}
            name={this.props.elementName}
            value={this.props.value}
            onChange={this.onInputChange}
            />
            </div>
        )
    }
}