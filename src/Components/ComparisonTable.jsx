import React, { Component } from 'react';

class ComparisonHeading extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        var sites = [];
        for(var i in this.props.sites) {
            sites.push(<th key={"head-site-" + this.props.sites[i]}>{this.props.sites[i]}</th>);
        }
        return (
            <tr>
                <th>Site Preference / Site</th>
                {sites}
            </tr>
        );
    }
}

class ComparisonRows extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        var rows = [];
        var rowsData = {};
        Object.keys(this.props.results).map((site) => {
            Object.keys(this.props.results[site]).map((group) => {
                Object.keys(this.props.results[site][group]).map((pref) => {
                    var prefKey = group+" / "+pref;
                    rowsData[prefKey] = rowsData[prefKey] || {};
                    rowsData[prefKey][site] = {
                        group: group,
                        pref: pref,
                        id: "pref_"+group+"_"+pref,
                        result: this.props.results[site][group][pref],
                        existed: (pref in this.props.results[site][group]),
                    }
                });
            });
        });
        
        Object.keys(rowsData).map((prefKey) => {
            var pref = prefKey;
            rows.push(<ComparisonRow preference={pref} key={"pref_"+pref} id={"pref_"+pref} siteConfigurations={rowsData[prefKey]} onDiff={this.props.onDiff} />);
        }) 
        
        return rows;
    }
}

class ComparisonRow extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        var sites = [];
        Object.keys(this.props.siteConfigurations).map((site) => {
            var diffLinks = [];
            var buttonClass = "btn-secondary";
            if(typeof this.props.siteConfigurations[site].result === 'object' && !("match" in this.props.siteConfigurations[site].result)) { // list differing systems per cell
                Object.keys(this.props.siteConfigurations[site].result).map((system) => {
                    if(this.props.siteConfigurations[site].existed && !this.props.siteConfigurations[site].result[system].match) { // inequality
                        diffLinks.push((
                            <button key={this.props.key+"_"+site+"_"+system} className="btn btn-link" onClick={() => {this.props.onDiff(system, site, this.props.siteConfigurations[site].group, this.props.siteConfigurations[site].pref)}}>{system}</button>
                        ));
                    }
                });
            } else {  // one button to compare
                if(!this.props.siteConfigurations[site].result.match) { // equality
                    if(this.props.siteConfigurations[site].result.error) {
                        buttonClass = "btn-danger";
                    }
                    diffLinks.push((
                        <button key={this.props.key+"_"+site} className={"btn "+buttonClass} onClick={() => {this.props.onDiff(null, site, this.props.siteConfigurations[site].group, this.props.siteConfigurations[site].pref)}}>DIFF</button>
                    ));
                }
            }

            sites.push((
                <td key={"row-" + site + this.props.id}>
                    {diffLinks}
                </td>
                )
            );
        });
        return (
            <tr key={"row-" + this.props.preference}>
                <th scope="row" id={"row-head-" + this.props.preference}>{this.props.preference}</th>
                {sites}
            </tr>
        );
    }
}

export default class ComparisonTable extends Component {
    render() {
        return (
            <table className="table table-striped table-bordered">
            <thead className="thead-dark">
                <ComparisonHeading sites={Object.keys(this.props.result)} />
            </thead>
            <tbody>
                <ComparisonRows results={this.props.result} onDiff={this.props.onDiff} />
            </tbody>
            </table>
        );
    }
}