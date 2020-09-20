import React, { Component } from 'react';

export default class DataConfigurationForm extends Component {
    constructor(props) {
        super(props);
        this.responsibility = null;
        this.state = {
            active: "equal-sites",
            showLeft: ["server","system"],
            showRight: ["server","system"],
        };
    }

    activeClass(group) {
        return this.state.active === group ? "active" : "";
    }

    makeActive(group) {
        var showLeft = ["server","system","site"],
            showRight = ["server","system","site"];
        if(group == 'equal-sites') {
            showLeft = ["server","system"];
            showRight = ["server","system"];
        }
        if(group == 'cross-sites') {
            showLeft = ["server","system","site"];
            showRight = ["server","system"];
        }
        if(group == 'cross-systems') {
            showLeft = ["server","system"];
            showRight = ["server"];
        }
        this.setState({
            showLeft,
            showRight,
            active: group,
        }, () => {
            this.handleMethodChange(group);
        });
        
    }

    revalidateSelectionOptions() {
        this.props.onUpdate(this.state.active, this.props.formState.baseServer, this.props.formState.baseSystem, this.props.formState.baseSite, this.props.formState.compServer, this.props.formState.compSystem, this.props.formState.compSite);
    }

    componentWillMount() {
        this.revalidateSelectionOptions();
    }

    handleMethodChange(method) {
        this.props.onUpdate(method, this.props.formState.baseServer, this.props.formState.baseSystem, this.props.formState.baseSite, this.props.formState.compServer, this.props.formState.compSystem, this.props.formState.compSite);
    }

    handleFormChangeBase(setting) {
        this.props.onUpdate(this.state.active, setting.server, setting.system, setting.site, this.props.formState.compServer, this.props.formState.compSystem, this.props.formState.compSite);
    }

    handleFormChangeComp(setting) {
        this.props.onUpdate(this.state.active, this.props.formState.baseServer, this.props.formState.baseSystem, this.props.formState.baseSite, setting.server, setting.system, setting.site);
    }

    render() {
        return (
            <div class="row">
                <div class="col">
                    <ul className="list-group" style={{cursor:"pointer"}}>
                        <li id="compare-opt-equal-sites" className={"list-group-item "+this.activeClass("equal-sites")} onClick={() => this.makeActive("equal-sites")}><b>Equal Site comparison</b><br /><small>Compares e.g. left DE vs right DE</small></li>
                        <li id="compare-opt-cross-sites" className={"list-group-item "+this.activeClass("cross-sites")} onClick={() => this.makeActive("cross-sites")}><b>Cross-Site comparison</b><br /><small>Compares exact site's left value to all sites on the right</small></li>
                        <li id="compare-opt-cross-systems" className={"list-group-item "+this.activeClass("cross-systems")} onClick={() => this.makeActive("cross-systems")}><b>Cross-System comparison (experimental)</b><br /><small>Compares the left system's sites to all the systems of the right server</small></li>
                    </ul>
                </div>
                <div class="col">
                    <div class="card">
                        <div className="form-group card-body">
                            <ConfigurationOptions responsibility={"base"} show={this.state.showLeft} servers={this.props.servers} systems={this.props.systems} sites={this.props.sites} server={this.props.formState.baseServer} system={this.props.formState.baseSystem} site={this.props.formState.baseSite} onChange={this.handleFormChangeBase.bind(this)} />
                            <small>{this.props.formState.baseServer} updated {this.props.updateInfo[this.props.formState.baseServer]}</small>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="card">
                        <div className="form-group card-body">
                            <ConfigurationOptions responsibility={"comp"} show={this.state.showRight} servers={this.props.servers} systems={this.props.systems} sites={this.props.sites} server={this.props.formState.compServer} system={this.props.formState.compSystem} site={this.props.formState.compSite}  onChange={this.handleFormChangeComp.bind(this)} />
                            <small>{this.props.formState.compServer} updated {this.props.updateInfo[this.props.formState.compServer]}</small>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

}

class ConfigurationOptions extends Component {
    constructor(props) {
        super(props);
    }

    handleSiteChange(event) {
        var current = Object.assign({}, this.props);
        current.site = event.target.value;
        this.props.onChange(current);
    }

    handleSystemChange(event) {
        var current = Object.assign({}, this.props);
        current.system = event.target.value;
        this.props.onChange(current);
    }

    handleServerChange(event) {
        var current = Object.assign({}, this.props);
        current.server = event.target.value;
        this.props.onChange(current);
    }

    makeConfigForm(selectedServer, selectedSystem, selectedSite) {
        var serverSelection, systemSelection, siteSelection;
        serverSelection = this.props.servers.map((server) => (
            <div className="form-check form-check-inline" key={'form'+this.props.responsibility+server}>
                <input className="form-check-input" type="radio" name={"select_server_"+this.props.responsibility} id={'form'+this.props.responsibility+server} value={server} onChange={this.handleServerChange.bind(this)} checked={this.props.server === server}></input>
                <label className="form-check-label" htmlFor={'form'+this.props.responsibility+server}>{server}</label>
            </div>
        ));
        if(!this.props.systems[selectedServer]) throw new Error('systems not built yet');
        systemSelection = this.props.systems[selectedServer].map((system) => (
            <div className="form-check form-check-inline" key={'form'+this.props.responsibility+selectedServer+system}>
                <input className="form-check-input" type="radio" name={"select_system_"+this.props.responsibility} id={'form'+this.props.responsibility+selectedServer+system} value={system} onChange={this.handleSystemChange.bind(this)} checked={this.props.system === system}></input>
                <label className="form-check-label" htmlFor={'form'+this.props.responsibility+selectedServer+system}>{system}</label>
            </div>
        ));
        if(!this.props.sites[selectedServer][selectedSystem]) throw new Error('sites not built yet');
        var siteOptions = [];
        this.props.sites[selectedServer][selectedSystem].map((site) => {
            siteOptions.push(<option value={site} key={'form'+this.props.responsibility+selectedServer+selectedSystem+"_site_"+site} selected={this.props.site === site}>{site}</option>);
        });
        if(this.props.responsibility === 'comp') {
            siteOptions.push(<option value="*" key={'form'+this.props.responsibility+selectedServer+selectedSystem+"_site_*"}>*</option>);
        }
        siteSelection = (
            <div className="form-check form-check-inline" key={'form'+this.props.responsibility+selectedServer+selectedSystem+"_site"}>
                <label className="form-check-label" htmlFor={'form'+this.props.responsibility+selectedServer+selectedSystem+"_site"}>Site</label>
                <select name={"select_site_"+this.props.responsibility} value={this.props.siteValue} onChange={this.handleSiteChange.bind(this)} id={'form'+this.props.responsibility+selectedServer+selectedSystem+"_site"} >
                    {siteOptions}
                </select>
            </div>
        );
        return {
            serverSelection,
            systemSelection,
            siteSelection
        }
    };

    render() {
        var serverSelection,systemSelection,siteSelection;
        try {
            ({serverSelection,systemSelection,siteSelection} = this.makeConfigForm(this.props.server, this.props.system, this.props.site));
        } catch(e) {
            return null;
        }
        var formElements = [];
        if(this.props.show.includes("server")) {
            formElements.push((
                <fieldset className="form-group col">
                    <label>Server</label>
                    <div>{serverSelection}</div>
                </fieldset>
            ));
        }
        if(this.props.show.includes("system")) {
            formElements.push((
                <fieldset className="form-group col">
                    <label>System</label>
                    <div>{systemSelection}</div>
                </fieldset>
            ));
        }
        if(this.props.show.includes("site")) {
            formElements.push((
                <fieldset className="form-group col">
                    <label>Site</label>
                    <div key={'site-selection_'+this.props.responsibility}>{siteSelection}</div>
                </fieldset>
            ));
        }
        return (
            <form className="form row align-items-start">
                {formElements}
            </form>
        );
    }
}
