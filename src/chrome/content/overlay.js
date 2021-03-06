/* ***** BEGIN LICENSE BLOCK Version: GPL 3.0 ***** 
 * FireMobileFimulator is a Firefox add-on that simulate web browsers of 
 * japanese mobile phones.
 * Copyright (C) 2008  Takahiro Horikawa <horikawa.takahiro@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * ***** END LICENSE BLOCK ***** */

var firemobilesimulator;
if (!firemobilesimulator)
	firemobilesimulator = {};
if (!firemobilesimulator.overlay)
	firemobilesimulator.overlay = {};

firemobilesimulator.overlay.onInitialize = function() {
	dump("[msim]onInitialize\n");

	firemobilesimulator.overlay.strings = document.getElementById("msim-strings");
	var windowContent = window.getBrowser();
	if (windowContent) {
		try {
			window.removeEventListener("load",
					firemobilesimulator.overlay.onInitialize, false);
		} catch (exception) {
			dump("[msim]removeEventListner error:" + exception + "\n");
		}
		//windowContent.addEventListener("load",
		//		firemobilesimulator.overlay.BrowserOnLoad, true);
		//window.addEventListener("load",
		//		firemobilesimulator.overlay.BrowserOnLoad, true);
		var appcontent = document.getElementById("appcontent");   // ブラウザ
		if (appcontent) {
			//appcontent.addEventListener("DOMContentLoaded", firemobilesimulator.overlay.BrowserOnLoad, true);
			appcontent.addEventListener("load", firemobilesimulator.overlay.BrowserOnLoad, true);
			gBrowser.tabContainer.addEventListener('TabSelect', function(evt) {
				firemobilesimulator.overlay.rewrite();
			}, false);
		} else {
			dump("[msim]no appcontent.\n");
		}

	}

	var initialized = firemobilesimulator.common.pref
			.getBoolPref("msim.config.initialized");
	if (!initialized) {
		// 何か初期化処理をしたい場合はここに記載
		// firemobilesimulator.common.pref.setBoolPref("msim.config.initialized",
		// true);
	}
	firemobilesimulator.core.updateIcon();
};

firemobilesimulator.overlay.onUnload = function() {
	dump("[msim]onUnload\n");
	var windowCount = 0;
	var windowEnumeration = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator)
			.getEnumerator("navigator:browser");

	try {
		window.removeEventListener("load",
				firemobilesimulator.overlay.onInitialize, false);
	} catch (exception) {
		dump("[msim]removeEventListner error:" + exception + "\n");
	}

	while (windowEnumeration.hasMoreElements()) {
		windowEnumeration.getNext();
		windowCount++;
	}

	dump("[msim]windowcount:" + windowCount.toString() + "\n");
	if (windowCount == 0) {
		//完全終了時
		//var resetOnQuit = firemobilesimulator.common.pref.getBoolPref("msim.config.general.reset-device-onquit");
		//if (resetOnQuit)
		//	firemobilesimulator.core.resetDevice();
	}

	try {
		window.removeEventListener("close",
				firemobilesimulator.overlay.onUnload, false);
	} catch (exception) {
		dump("[msim]removeEventListner error:" + exception + "\n");
	}

};

firemobilesimulator.overlay.displayDeviceSwitcherMenu = function(menu, suffix) {
	var optionsSeparator = document.getElementById("msim-separator2-" + suffix);

	this.removeGeneratedMenuItems(menu, ["msim-default-" + suffix,
					"msim-options-" + suffix, "msim-devicedb-" + suffix, "msim-about-" + suffix]);

	var deviceCount = firemobilesimulator.common.pref
			.getIntPref("msim.devicelist.count");
	for (var i = 1; i <= deviceCount; i++) {
		var device = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist." + i
						+ ".label");
		if (!device) continue;

		var carrier = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist." + i
						+ ".carrier");
		var useragent = firemobilesimulator.common.pref
				.copyUnicharPref("msim.devicelist." + i
						+ ".useragent");

		//var menuItem = menu.appendChild(document.createElement("menuitem"));
		var menuItem = menu.insertBefore(document.createElement("menuitem"), optionsSeparator);
		menuItem.setAttribute("id", "msim-device-" + suffix + "-" + i);
		menuItem.setAttribute("label", carrier + " " + device);
		menuItem.setAttribute("oncommand",
				"firemobilesimulator.core.setDevice(" + i + ");");
		menuItem.setAttribute("type", "radio");
		menuItem.setAttribute("name", "devicelist");
	}

	var tab = gBrowser.selectedTab;
	var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);
	var currentId = ss.getTabValue(tab, "firemobilesimulator-device-id");
	var currentMenu = document.getElementById("msim-default-" + suffix);
	if (currentId) {
		currentMenu = document.getElementById("msim-device-" + suffix + "-" + currentId);
	}
	currentMenu.setAttribute("checked", true);
};

firemobilesimulator.overlay.removeGeneratedMenuItems = function(menu,
		permanentMenus) {
	var menuItem = null;

	// radioMenuItems = menu.getElementsByAttribute("type", "radio");
	var menuItems = menu.getElementsByTagName("menuitem");

	while (menuItems.length > permanentMenus.length) {
		menuItem = menuItems[3]; //注意メニューの構造が変わったら変える

		if (!menuItem.hasAttribute("id")) {
			menu.removeChild(menuItem);
		} else {
			var deleteFlag = true;
			for (var i = 0; i < permanentMenus.length; i++) {
				if (menuItem.getAttribute("id") == permanentMenus[i]) {
					deleteFlag = false
				}
			}
			deleteFlag && menu.removeChild(menuItem);
		}
	}

};

firemobilesimulator.overlay.openOptions = function() {
	window.openDialog("chrome://msim/content/options/options.xul",
			"msim-options-dialog", "centerscreen,chrome,modal,resizable");
};

firemobilesimulator.overlay.openDeviceDB = function() {
	window.getBrowser().selectedTab = window.getBrowser().addTab("chrome://msim/content/html/device_add.html");
};

firemobilesimulator.overlay.openAbout = function() {
	window.openDialog("chrome://msim/content/about.xul", "msim-about-dialog",
			"centerscreen,chrome,modal,resizable");
};

firemobilesimulator.overlay.BrowserOnLoad = function(objEvent) {
	//dump("[msim]BrowserOnLoad is fired.\n");

	var ndDocument = objEvent.originalTarget;
	if (ndDocument.nodeName != "#document") {
		//dump("[msim]nodeName is not #document, but "+ndDocument.nodeName+"\n");
		return;
	}

	// Firefoxの埋め込み表示Content-Typeは、自動的にDOMに変換されている為、除外する。
	if (ndDocument.contentType != "text/html") {
		dump("document is not html\n");
		return;
	}

	var tab = null;
	var targetBrowserIndex = gBrowser.getBrowserIndexForDocument(ndDocument);
	if (targetBrowserIndex != -1) {
		tab = gBrowser.tabContainer.childNodes[targetBrowserIndex];
	}

	//var id = tab.getAttribute("firemobilesimulator-device-id");
	if (tab) {
		var ss = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore);
		var id = ss.getTabValue(tab, "firemobilesimulator-device-id");
		var pref_prefix = "msim.devicelist." + id;
		var carrier = firemobilesimulator.common.pref.copyUnicharPref(pref_prefix + ".carrier");

		if (carrier) {
			var contentHandler = firemobilesimulator.contentHandler.factory(carrier);
			contentHandler && contentHandler.filter(ndDocument, id);
		}
	}
};

// 他のツールバーボタンが開いていても、FireMobileSimulatorのツールバーボタンを開く
firemobilesimulator.overlay.openToolbarButton = function(currentToolbarButton) {
	if (currentToolbarButton && !currentToolbarButton.open) {
		var toolbarButton = null;
		var toolbarButtons = currentToolbarButton.parentNode
				.getElementsByTagName("toolbarbutton");
		var toolbarButtonsLength = toolbarButtons.length;

		for (var i = 0; i < toolbarButtonsLength; i++) {
			toolbarButton = toolbarButtons.item(i);

			if (toolbarButton && toolbarButton != currentToolbarButton
					&& toolbarButton.open) {
				toolbarButton.open = false;
				currentToolbarButton.open = true;

				break;
			}
		}
	}
};

firemobilesimulator.overlay.rewrite = function () {
	var tab = gBrowser.selectedTab;
	var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);
	var id = ss.getTabValue(tab, "firemobilesimulator-device-id");
	var pref_prefix = "msim.devicelist." + id;
	var carrier = firemobilesimulator.common.pref.copyUnicharPref(pref_prefix + ".carrier");
	var name = firemobilesimulator.common.pref.copyUnicharPref(pref_prefix + ".label");

	var statusImage = document.getElementById("msim-status-image");
	var statusLabel = document.getElementById("msim-status-label");
	var msimButton = document.getElementById("msim-button");
	var menu = document.getElementById("msim-menu");
	var target = [msimButton, menu];

	if (id) {
		target.forEach(function(item) {
			if (item) {
				item.setAttribute("device", "on");
			}
		});
		statusImage.setAttribute("device", "on");
	} else {
		target.forEach(function(item) {
			if (item) {
				item.removeAttribute("device");
			}
		});
		statusImage.removeAttribute("device");
	}
	statusLabel.setAttribute("value", name);
};
/*
 * firemobilesimulator.overlay.onInitialize = function(e) {
 * firemobilesimulator.overlay.onInitialize(e); };
 * 
 * firemobilesimulator.overlay.onUnload = function(e) {
 * firemobilesimulator.overlay.onUnload(e); };
 */

window.addEventListener("load", firemobilesimulator.overlay.onInitialize, false);
window.addEventListener("unload", firemobilesimulator.overlay.onUnload, false);
document.addEventListener("SSTabRestoring", function (e) {
	firemobilesimulator.overlay.rewrite();
}, false);

dump("[msim]overlay.js is loaded.\n");
