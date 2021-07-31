import React, { Component } from 'react';
import fetchJsonp from 'fetch-jsonp';
import DataConfigurationForm from "./DataConfigurationForm.jsx";
import ComparisonTable from "./ComparisonTable.jsx";
import DiffDialog from "./DiffDialog.jsx";
import Modal from 'react-modal';

export default class Page extends Component {

    constructor(props) {
        super(props);
        this.state = {
            dataUsable: false,
            sitePreferences: {},
            comparisonResult: {},
            diffVisible: false,
            diffA: "",
            diffB: "",
            titleA: "",
            titleB: "",
            config: {
                method: 'equal-sites',
                baseServer: 'staging',
                baseSystem: 'production',
                baseSite: 'DE',
                compServer: 'production',
                compSystem: 'production',
                compSite: '*',
            },
            updateInfo: {},
            modalIsOpen: false,
            servers: [],
            systems: {},
            sites: {},
            formSelectionSanitized: false,
        };
        this.filesToLoad = window.FilesToLoad; // from import-data.js
        this.filesToStillLoad = this.filesToLoad.length;
        this.modalStyles = {
            overlay: {
                zIndex: 3,
            },
            content: {
                width: "60%",
                height: "80%",
                top: '50%',
                left: '50%',
                right: 'auto',
                bottom: 'auto',
                marginRight: '0%',
                transform: 'translate(-50%, -50%)',
                boxShadow: "#888 0px 0px 20px",
            }
        };
        
        this.addPreferencesCallback.bind(this);
        this.filesToLoad.forEach((name) => {
            fetchJsonp('./data/data-'+name+'.jsonp', { 
                timeout: 10000,
                jsonpCallbackFunction: 'addPreferencesCallback_'+name 
            })
            .then((data, updateInfo) => {
                return data.json();
            }).then((data) => {                
                this.addPreferencesCallback(data);
            });
        });
    }

    updateComparisonTable(method, baseServer, baseSystem, baseSite, compServer, compSystem, compSite) {
        /*
            wait for the proper system selection 
        */
       var whatChanged = "";
       // what changed ?
        if(baseServer !== this.state.config.baseServer) {
            whatChanged = "baseServer";
        }
        else if(baseSystem !== this.state.config.baseSystem) {
            whatChanged = "baseSystem";
        }
        else if(baseSite !== this.state.config.baseSite) {
            whatChanged = "baseSite";
        }
        else if(compServer !== this.state.config.compServer) {
            whatChanged = "compServer";
        }
        else if(compSystem !== this.state.config.compSystem) {
            whatChanged = "compSystem";
        }
        else if(compSite !== this.state.config.compSite) {
            whatChanged = "compSite";
        }
        else if(method !== this.state.config.method) {
            whatChanged = "method";
        }
        if(!whatChanged) {
            return;
        }
        // assign new values to the rest if necessary
        // fall-through style switch-case, fixing all change-following settings
        switch(whatChanged) {
            case "baseServer":
                if(!this.state.sitePreferences[baseServer][baseSystem]) {
                    baseSystem = Object.keys(this.state.sitePreferences[baseServer])[0]
                }
            case "baseSystem":
                if(!this.state.sitePreferences[baseServer][baseSystem][baseSite]) {
                    baseSite = Object.keys(this.state.sitePreferences[baseServer][baseSystem])[0]
                }
            case "baseSite":
            case "compServer":
                if(!this.state.sitePreferences[compServer][compSystem]) {
                    compSystem = Object.keys(this.state.sitePreferences[compServer])[0]
                }
            case "compSystem":
                if(!this.state.sitePreferences[compServer][compSystem][compSite]) {
                    compSite = Object.keys(this.state.sitePreferences[compServer][compSystem])[0]
                }
            case "compSite":
            default:
                break;
        }
        var config = {
            "method": method,
            "baseServer": baseServer,
            "baseSystem": baseSystem,
            "baseSite": baseSite,
            "compServer": compServer,
            "compSystem": compSystem,
            "compSite": "*",
        }
        this.setState({
            "formSelectionSanitized": false,
            "config": config,
        }, () => {
            this.buildFormData();
            if(this.state.config.method === 'equal-sites') {
                this.compareTwoSystemsSiteToSite();
            }
            if(this.state.config.method === 'cross-sites') {
                this.compareBaseSiteAcrossOtherSystem();
            }
            if(this.state.config.method === 'cross-systems') {
                this.compareBaseSystemWithAllSystems();
            }
        });
    }

    equalizedSitePreferences(defaultValue) {
        var accumulatedPrefs = {};
        var combine = [
            [this.state.config.baseServer, this.state.config.baseSystem], 
            [this.state.config.compServer, this.state.config.compSystem]
        ];
        for(var i in combine) {
            var compSystems =  Object.keys(this.state.sitePreferences[combine[i][0]]).filter(function (system) {
                return system === "*" || system === combine[i][1];
            });
            var j = i;
            compSystems.forEach(function(system) {
                var comp = this.state.sitePreferences[combine[j][0]][system];
                if(comp === undefined) return;
                Object.keys(comp).forEach((site) => {
                    Object.keys(comp[site]).forEach((group) => {
                        if(typeof accumulatedPrefs[group] !== 'object') {
                            accumulatedPrefs[group] = {};
                        }
                        Object.keys(comp[site][group]).forEach((id) => {
                            if (id.substr(0, 2) !== 'c_') return;
                            accumulatedPrefs[group][id] = defaultValue;
                        });
                    });
                });
            }.bind(this));
        }
        return accumulatedPrefs;
    }

    compareTwoValues(value, compareTo) {
        var type = "string";
        var error = null;
        if(typeof value !== "object" && (String(value).trim()[0] === '[' || String(value).trim()[0] === '{')
           && typeof compareTo !== "object" && (String(compareTo).trim()[0] === '[' || String(compareTo).trim()[0] === '{')) {
            // very likely a JSON config, to ease comparison re-beautify it
            // comparison is only useful if both sides are filled
            type = "json";
            try {
                var newValue = JSON.stringify(JSON.parse(String(value).trim()), null, '  ');
                value = newValue;
            } catch(e) {
                error = "json-broken-base";
            }
            try {
                var newCompareTo = JSON.stringify(JSON.parse(String(compareTo).trim()), null, '  ');
                compareTo = newCompareTo;
            } catch(e) {
                error = "json-broken-comp";
            }
        }
        if(typeof value === "boolean" || typeof compareTo === "boolean") {
            type = "boolean";
        }
        // Real usecase? 
        if(typeof value === "object" || typeof compareTo === "object") {
            value = JSON.stringify(value);
            compareTo = JSON.stringify(compareTo);
        }
        value = String(value);
        compareTo = String(compareTo);
        return {"match": value === compareTo, "type":type, "error":error};
    }

    compareBaseSystemWithAllSystems() {
        // * taking the site on the left and compare it per site to each systems on the right

        var base = this.state.sitePreferences[this.state.config.baseServer][this.state.config.baseSystem];
        var systems = Object.keys(this.state.sitePreferences[this.state.config.compServer]);
        //var comp = this.state.sitePreferences[this.state.config.compServer][this.state.config.baseSystem]; // assuming the prefs are there on all systems
        var comparisonResult = {};
        Object.keys(base).map(function (site) {
            comparisonResult[site] = this.equalizedSitePreferences(null);
            return Object.keys(comparisonResult[site]).map(function (group) {
                return Object.keys(comparisonResult[site][group]).map(function (id) {
                    if (id.substr(0, 2) !== 'c_') return null;
                    var value = this.state.sitePreferences[this.state.config.baseServer][this.state.config.baseSystem][site][group][id];
                    comparisonResult[site][group][id] = {};
                    systems.map(function (system) {
                        var compareTo = null;
                        if(this.state.sitePreferences[this.state.config.compServer][system][site]) {
                            compareTo = this.state.sitePreferences[this.state.config.compServer][system][site][group][id];
                            comparisonResult[site][group][id][system] = this.compareTwoValues(value, compareTo);
                        }
                    }.bind(this));
                    return null;
                }.bind(this));
            }.bind(this));
        }.bind(this));
        this.setState({
            comparisonResult
        });
    }

    compareBaseSiteAcrossOtherSystem() {
        // taking the site on the left and compare it to each site on the right
        var comp = this.state.sitePreferences[this.state.config.compServer][this.state.config.compSystem];
        var comparisonResult = {};
        Object.keys(comp).map(function (site) {
            comparisonResult[site] = this.equalizedSitePreferences(true);
            Object.keys(comparisonResult[site]).map(function (group) {
                Object.keys(comparisonResult[site][group]).map(function (id) {
                    if (id.substr(0, 2) !== 'c_') return;
                    var value = comp[site][group][id];
                    var compareTo = "";
                    try {
                        compareTo = this.state.sitePreferences[this.state.config.baseServer][this.state.config.baseSystem][this.state.config.baseSite][group][id];
                    } catch(e) {}
                    comparisonResult[site][group][id] = this.compareTwoValues(value, compareTo);
                }.bind(this));
            }.bind(this));
        }.bind(this));
        // window.comparisonResult = comparisonResult;
        this.setState({
            comparisonResult
        });
    }

    compareTwoSystemsSiteToSite() {
        // is system A configured equal to System B?
        var comp = this.state.sitePreferences[this.state.config.compServer][this.state.config.compSystem];
        if(!comp) return;
        var comparisonResult = {};
        Object.keys(comp).map(function (site) {
            comparisonResult[site] = this.equalizedSitePreferences(true);
            Object.keys(comparisonResult[site]).map(function (group) {
                Object.keys(comparisonResult[site][group]).map(function (id) {
                    if (id.substr(0, 2) !== 'c_') return;
                    var value = comp[site][group][id];
                    var compareTo = "";
                    try {
                        compareTo = this.state.sitePreferences[this.state.config.baseServer][this.state.config.baseSystem][site][group][id];
                    } catch(e) {
                        compareTo = "N/A";
                    }
                    //if(id == "c_autoOverlayConfig" && site =="US") debugger;
                    comparisonResult[site][group][id] = this.compareTwoValues(value, compareTo);
                }.bind(this));
            }.bind(this));
        }.bind(this));
        window.comparisonResult = comparisonResult;
        this.setState({
            comparisonResult
        });
    }

    addPreferencesCallback(data) {
        var server = Object.keys(data)[0];
        var updateInfo = this.state.updateInfo;
        updateInfo[server] = "not given";
        if(data["updateInfo"]) {
            var d = new Date(Date.parse(data["updateInfo"]+ " GMT"));
            updateInfo[server] = d.toLocaleDateString()+" - "+d.toLocaleTimeString();
        }
        var newSitePreferences = this.state.sitePreferences;
        newSitePreferences[server] = data[server];
        this.setState({
            dataUsable: false,
            updateInfo,
            sitePreferences: newSitePreferences,
            }, () => {
                var servers = [], systems = {}, sites = {};
                Object.keys(this.state.sitePreferences).forEach((server,v) => {
                    servers.push(server);
                    Object.keys(this.state.sitePreferences[server]).forEach((system,v) => {
                        systems[server] = systems[server] || [];
                        systems[server].push(system);
                        sites[server] = sites[server] || {};
                        Object.keys(this.state.sitePreferences[server][system]).forEach((site,v) => {
                            sites[server][system] = sites[server][system] || [];
                            sites[server][system].push(site);
                        });
                    });
                });

                this.filesToStillLoad--;
                var dataUsable = this.filesToStillLoad <= 0;

                this.setState({
                    dataUsable,
                    "servers": servers,
                    "systems": systems,
                    "sites": sites,
                }, () => {
                    
                    if(this.state.dataUsable) {
                        var method = 'equal-sites',
                            baseServer = servers[0],
                            baseSystem = systems[baseServer][0],
                            baseSite = sites[baseServer][baseSystem][0],
                            compServer = baseServer,
                            compSystem = baseSystem,
                            compSite = baseSite;
                        this.updateComparisonTable(method, baseServer, baseSystem, baseSite, compServer, compSystem, compSite)
                    }
                });
            }
        );
    }

    buildFormData() {

        const {selectedServer: selectedBaseServer, selectedSystem: selectedBaseSystem, selectedSite: selectedBaseSite} = this.performFormDataSelectionFallbackHandling(this.state.servers, this.state.systems, this.state.sites, this.state.config.baseServer, this.state.config.baseSystem, this.state.config.baseSite);
        const {selectedServer: selectedCompServer, selectedSystem: selectedCompSystem, selectedSite: selectedCompSite} = this.performFormDataSelectionFallbackHandling(this.state.servers, this.state.systems, this.state.sites, this.state.config.compServer, this.state.config.compSystem, this.state.config.compSite);

        this.setState({
            "formSelectionSanitized": true,
            "config": {
                "method": this.state.config.method, // not updating this here now
                "baseServer": selectedBaseServer,
                "baseSystem": selectedBaseSystem,
                "baseSite": selectedBaseSite,
                "compServer": selectedCompServer,
                "compSystem": selectedCompSystem,
                "compSite": this.state.config.compSite, // * is actually what I want at the moment
            }
        });
    }

    performFormDataSelectionFallbackHandling(servers, systems, sites, selectedServer, selectedSystem, selectedSite) {
        var selectFirstIfSelectedUnavailable = (options, selected) => {
            if(selected === '*') return selected;
            var selectedOption = options.filter((v) => v === selected);
            if(selectedOption.length > 0) {
                selectedOption = selectedOption[0];
            } else {
                selectedOption = options[0];
            }
            return selectedOption;
        };
        var eventuallySelectedServer = selectFirstIfSelectedUnavailable(servers, selectedServer);
        var eventuallySelectedSystem = selectFirstIfSelectedUnavailable(systems[eventuallySelectedServer], selectedSystem);
        var eventuallySelectedSite = selectFirstIfSelectedUnavailable(sites[eventuallySelectedServer][eventuallySelectedSystem], selectedSite);
        return {
            selectedServer : eventuallySelectedServer,
            selectedSystem : eventuallySelectedSystem,
            selectedSite : eventuallySelectedSite
        }
    }



    activateDiff(system, site, group, prop) {
        var a="",b="",titleA="",titleB="";
        if(this.state.config.method === 'equal-sites') {
            try {
                a = String(this.state.sitePreferences[this.state.config.baseServer][this.state.config.baseSystem][site][group][prop]);
                a = a==="undefined" ? "" : a;
            } catch(e) {}
            try {
                b = String(this.state.sitePreferences[this.state.config.compServer][this.state.config.compSystem][site][group][prop]);
                b = b==="undefined" ? "" : b;
            } catch(e) {}
            titleA = `${this.state.config.baseServer}: ${this.state.config.baseSystem} - ${site}\n${group} / ${prop}`;
            titleB = `${this.state.config.compServer}: ${this.state.config.compSystem} - ${site}\n${group} / ${prop}`;
        }
        if(this.state.config.method === 'cross-sites') {
            try {
                a = String(this.state.sitePreferences[this.state.config.baseServer][this.state.config.baseSystem][this.state.config.baseSite][group][prop]);
                a = a==="undefined" ? "" : a;
            } catch(e) {}
            try {
                b = String(this.state.sitePreferences[this.state.config.compServer][this.state.config.compSystem][site][group][prop]);
                b = b==="undefined" ? "" : b;
            } catch(e) {}
            titleA = `${this.state.config.baseServer}: ${this.state.config.baseSystem} - ${this.state.config.baseSite}\n${group} / ${prop}`;
            titleB = `${this.state.config.compServer}: ${this.state.config.compSystem} - ${site}\n${group} / ${prop}`;
        }
        if(this.state.config.method === 'cross-systems') {
            try {
                a = String(this.state.sitePreferences[this.state.config.baseServer][this.state.config.baseSystem][site][group][prop]);
                a = a==="undefined" ? "" : a;
            } catch(e) {}
            try {
                b = String(this.state.sitePreferences[this.state.config.compServer][system][site][group][prop]);
                b = b==="undefined" ? "" : b;
            } catch(e) {}
            titleA = `${this.state.config.baseServer}: ${this.state.config.baseSystem} - ${site}\n${group} / ${prop}`;
            titleB = `${this.state.config.compServer}: ${system} - ${site}\n${group} / ${prop}`;
        }
        this.setState({
            diffA: a,
            diffB: b,
            titleA,
            titleB
        });
        this.openModal();
    }

    openModal() {
        this.setState({
            modalIsOpen: true,
            diffVisible: true
        });
    }

    afterOpenModal() {
        // references are now sync'd and can be accessed.
    }

    closeModal() {
        this.setState({
            modalIsOpen: false,
            diffVisible: false 
        });
    }

    formSelectionSanitized() {
        return this.state.formSelectionSanitized;
    }

    componentWillUpdate() {
    }

    render() {
        if (!this.state.dataUsable) {
            return (<p>Waiting</p>);
        }
        return (
            <div className="App">
                <header className="App-header">
                    <h1>Site Preference Comparison</h1>
                    <DataConfigurationForm formState={this.state.config} servers={this.state.servers} systems={this.state.systems} sites={this.state.sites} updateInfo={this.state.updateInfo} onUpdate={this.updateComparisonTable.bind(this)} />
                </header>
                <article>
                    <ComparisonTable data={this.state.sitePreferences} result={this.state.comparisonResult} onDiff={this.activateDiff.bind(this)} />
                    <Modal
                        isOpen={this.state.modalIsOpen}
                        onAfterOpen={this.afterOpenModal.bind(this)}
                        onRequestClose={this.closeModal.bind(this)}
                        style={this.modalStyles}
                        contentLabel="Comparison">
                        <DiffDialog active={this.state.diffVisible} a={this.state.diffA} b={this.state.diffB} titleA={this.state.titleA}  titleB={this.state.titleB} />
                    </Modal>
                </article>
            </div>
        );
    }
}