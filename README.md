# Compare Salesforce CommerceCloud Site Preferences 

This tool helps your Shop Managers to
* own a grown set of SitePreferences again.
* oversee the entire SitePreference structure of your Online Shop
* compare settings between sites and server
* show differences between configurations

![Screenshot of comparison overview](https://github.com/keinerweiss/sfcc-sirepref-diff/raw/master/screenshots/SitePreferenceComparisonScreen.png "Comparison overview")

![Screenshot of comparison methods](https://github.com/keinerweiss/sfcc-sirepref-diff/raw/master/screenshots/SitePreferenceComparisonMethods.png "Available comparison methods")

## What do you need to use this?

* A Salesforce CommerceCloud Contract
* A online location to store the web application
  * The static files in SFCC on your development instance could be an option
  * Since data files are JSONP, it can also run from your harddrive directly
* Python3 (to fetch data updates)
* nodejs / npm (to build the web application)

## How does this work?

* Read SitePreferences from any of your systems
* Store bundled SitePreferences in a JSONP file per server
* A React App to read the bundled data and compare within the browser as you choose
* Once built you only need to update the data files

## Build the app

The web application builds without any credentials set up.

```
npm install
npm run build
```

The contents of the `build` folder can be published to a web server.\
You will then need to adjust the setup files and provide data files.

## Configure your landscape and credentials

* Rename `sfcc-fetch-siteprefs/conf/auth.py_dist` to `sfcc-fetch-siteprefs/conf/auth.py`\
  Change the credentials inside for each of your systems or sandboxes.\
  Enable proxies if you must.

* Add your Systems and Sites Setup to `sfcc-fetch-siteprefs/conf/systems.py`

* Add your list of SitePreference groups to `sfcc-fetch-siteprefs/conf/sitepref_setup.py`

* Add the servers you want to compare to `public/import-data.js`\
  After build you can always update this file without a new build

* Copy your fetched data files to `public/data/`\
  After building you can always update the files without a new build
  
  
## Generate data files

This OCAPI permissions is required:
```
        {
          "resource_id":"/sites/{site_id}/site_preferences/preference_groups/{group_id}/{instance_type}",
          "methods":[
            "get"
          ],
          "read_attributes":"(**)"
        }
```
You can then (depending on your systems setup configuration) run
```
cd sfcc-fetch-siteprefs
python3.exe ./fetch-siteprefs.py development staging
```
Copy the resulting `*.jsonp` files to the `build/data` folder or directly to the webserver into the `data` folder.
