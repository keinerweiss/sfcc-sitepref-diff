"""
acquirationConfig = {
	"name": {
		"sites": [
			"site1",
			"site2",
		],
		"systems": [
			"development",
			"staging",
			"production",
		]
	},
}
"""

allSites = [
	"DE",
	"FR"
]

acquirationConfig = {
	"production": {
		"sites": allSites,
		"systems": [
			"production",
		]
	},
	"staging": {
		"sites": allSites,
		"systems": [
			"development",
			"staging",
			"production",
		]
	},
	"development": {
		"sites": allSites,
		"systems": [
			"development",
		]
	}
}