"""
python3.exe ./fetch-siteprefs.py development staging

Systems from systems.py:acquirationConfig
"""

""" OCAPI Permissions required:
        {
          "resource_id":"/sites/{site_id}/site_preferences/preference_groups/{group_id}/{instance_type}",
          "methods":[
            "get"
          ],
          "read_attributes":"(**)"
        }
"""
import socket
import requests
from requests.auth import HTTPBasicAuth
import json
import csv
import time
import sys
import datetime as dt
# rename conf/auth.py_dist to conf/auth.py and change credentials
from conf import auth
from conf import systems
from conf import sitepref_setup

argv = sys.argv[1:]

fetchServers = argv

ocapi_config = auth.ocapi_config
proxies = auth.proxies
groups = sitepref_setup.groups
acquirationConfig = systems.acquirationConfig

def getAccessToken(server):
	global proxies, auth, ocapi_config
	domain_ocapi = ocapi_config[server]["domain"]
	id_ocapi = ocapi_config[server]["clientId"]
	user = ocapi_config[server]["user"]
	password = ocapi_config[server]["password"]
	accessToken = ocapi_config[server]["accessToken"] if "accessToken" in ocapi_config[server] else None
	accessTokenTimeout = ocapi_config[server]["accessTokenTimeout"] if "accessTokenTimeout" in ocapi_config[server] else None
	if not accessToken or int(time.time()) > accessTokenTimeout:
		pass_token = ocapi_config[server]["passToken"]
		url_getToken = 'https://'+domain_ocapi+'/dw/oauth2/access_token?client_id='+id_ocapi+'&grant_type=urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken'
		r = requests.post(url_getToken, 
			auth = HTTPBasicAuth(user, password+":"+pass_token),
			headers = {
				'Content-Type': 'application/x-www-form-urlencoded',
				'grant_type': 'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken',
			},
			proxies=proxies
		)
		token = r.json()
		if('access_token' not in token):
			print("FATAL; Query for access token failed; Response: " + r.text + ";;\n")
		accessToken = token['access_token']
		accessTokenTimeout = int(time.time())+300
		ocapi_config[server]["accessToken"] = accessToken
		ocapi_config[server]["accessTokenTimeout"] = accessTokenTimeout
	return accessToken

def findPreferences(server, site, group, system):
	global proxies
	domain_ocapi = ocapi_config[server]["domain"]
	url_preferenceSearch = 'https://'+domain_ocapi+'/s/-/dw/data/v20_3/sites/'+site+'/site_preferences/preference_groups/'+group+'/'+system+''
	r = requests.get(url_preferenceSearch,
		headers = {
			'Authorization': 'Bearer '+getAccessToken(server),
			'Content-Type': 'application/json'
		},
		proxies=proxies
	)
	r.close()
	return r.text

for server in fetchServers:
	f = open("data-"+server+".jsonp", "w", encoding='utf-8')
	f.write("addPreferencesCallback_"+server+"({")
	f.write("'"+server+"': { ")
	systems = acquirationConfig[server]["systems"]
	for system in systems:
		f.write("'"+system+"': { ")
		sites = acquirationConfig[server]["sites"]
		for site in sites:
			f.write("'"+site+"': { ")
			for group in groups:
				print(server+': '+system+' / '+site+' / '+group)
				f.write("'"+group+"': ")
				preferencesJson = findPreferences(server, site, group, system)
				if(preferencesJson):
					f.write(preferencesJson)
				else:
					f.write("{}")
				f.write(",")
			f.write("},")
		f.write("},")
	f.write("}, 'updateInfo': '"+str(dt.datetime.utcnow())+"'});")
	f.close()