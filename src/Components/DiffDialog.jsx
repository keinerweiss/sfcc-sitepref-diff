import React, { Component } from 'react';
import ReactDiffViewer from 'react-diff-viewer'

export default class DiffDialog extends Component {

    render() {
        if(!this.props.active) {
            return <div></div>;
        }
        return (
            <ReactDiffViewer
                oldValue={this.props.a}
                newValue={this.props.b}
                splitView={true}
                useDarkTheme={false}
                disableWordDiff={true}
                hideLineNumbers={true}
                leftTitle={this.props.titleA}
                rightTitle={this.props.titleB}
            />
        );
    }
}