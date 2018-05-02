var winston = require('winston');
var WidgetData = require('./widgetdata');
var UserPrefs = require('./userprefs');
var QueryData = require('./querydata');
var ProdCompData = require('./prodcompdata');
var OrgData = require('./orgdata');
var PinData = require('./pindata');
var DirMgrData = require('./dirmgrdata');
var MgrCompData = require('./mgrcompdata');
var QueryBugs = require('./querybugs');
var ReleaseMilestone = require('./releasemilestone');
var Mobile = require('./mobile');
var TopX = require('./topx');
var PermanentData = require('./permanentData')
var MailNotif = require('./mailnotif');
var AppGlance = require('./appglance');

exports.getBugsforQuery = QueryBugs.getBugsforQuery;

exports.getMilestones = ReleaseMilestone.getMilestones;
exports.saveMilestone = ReleaseMilestone.saveMilestone;
exports.deleteMilestone = ReleaseMilestone.deleteMilestone;

exports.listWidgets = WidgetData.listWidgets;
exports.widgetDetails = WidgetData.widgetDetails;
exports.saveWidget = WidgetData.saveWidget;
exports.shareWidget = WidgetData.shareWidget;
exports.unshareWidget = WidgetData.unshareWidget;
exports.deleteWidget = WidgetData.deleteWidget;
exports.listMetrics = WidgetData.listMetrics;
exports.metricDefns = WidgetData.metricDefns;
exports.getWidgetGraphData = WidgetData.getWidgetGraphData;
exports.saveWidgetGraphData = WidgetData.saveWidgetGraphData;
exports.listPublicWidgets = WidgetData.listPublicWidgets;

exports.getViewIDforRelease = QueryData.getViewIDforRelease;
exports.queryDef = QueryData.queryDef;
exports.viewDef = QueryData.viewDef;
exports.viewIdDefectData = QueryData.viewIdDefectData;
exports.viewIdDefectData2 = QueryData.viewIdDefectData2;
exports.queryIdTrendData = QueryData.queryIdTrendData;
exports.viewIdTrendData = QueryData.viewIdTrendData;

exports.queryIdProductData = ProdCompData.queryIdProductData;
exports.queryIdComponentProductData = ProdCompData.queryIdComponentProductData;
exports.queryIDProdCompSearch = ProdCompData.queryIDProdCompSearch;
exports.queryIdProdCompTrendData = ProdCompData.queryIdProdCompTrendData;
exports.ProdCompListSearch = ProdCompData.ProdCompListSearch;
exports.viewIdProductData = ProdCompData.viewIdProductData;
exports.viewIdComponentProductData = ProdCompData.viewIdComponentProductData;
exports.viewIDProdCompSearch = ProdCompData.viewIDProdCompSearch;
exports.viewIdProdCompTrendData = ProdCompData.viewIdProdCompTrendData;

exports.topHier = OrgData.topHier;
exports.queryIdOrgData = OrgData.queryIdOrgData;
exports.queryIdOrgUserData = OrgData.queryIdOrgUserData;
exports.queryIdOrgUserSearch = OrgData.queryIdOrgUserSearch;
exports.queryIdOrgTrendData = OrgData.queryIdOrgTrendData;
exports.OrgUserListSearch = OrgData.OrgUserListSearch;
exports.viewIdOrgData = OrgData.viewIdOrgData;
exports.viewIdOrgUserData = OrgData.viewIdOrgUserData;
exports.viewIdOrgUserSearch = OrgData.viewIdOrgUserSearch;
exports.viewIdOrgTrendData = OrgData.viewIdOrgTrendData;

exports.queryIdPinData = PinData.queryIdPinData;
exports.PinListSearch = PinData.PinListSearch;
exports.queryIdPinTrendData = PinData.queryIdPinTrendData;
exports.queryIdPinSearch = PinData.queryIdPinSearch;
exports.viewIdPinData = PinData.viewIdPinData;
exports.viewIdPinTrendData = PinData.viewIdPinTrendData;
exports.viewIdPinSearch = PinData.viewIdPinSearch;
exports.SegmentOQGlanceMob = PinData.SegmentOQGlanceMob;

exports.DirMgrListSearch = DirMgrData.DirMgrListSearch;
exports.queryIdDirData = DirMgrData.queryIdDirData;
exports.queryIdMgrDirData = DirMgrData.queryIdMgrDirData;
exports.queryIdMgrDirTrendData = DirMgrData.queryIdMgrDirTrendData;
exports.queryIdMgrDirSearch = DirMgrData.queryIdMgrDirSearch;
exports.viewIdDirData = DirMgrData.viewIdDirData;
exports.viewIdMgrDirData = DirMgrData.viewIdMgrDirData;
exports.viewIdMgrDirTrendData = DirMgrData.viewIdMgrDirTrendData;
exports.viewIdMgrDirSearch = DirMgrData.viewIdMgrDirSearch;
exports.viewIdDirTrendData = DirMgrData.viewIdDirTrendData;
exports.queryIdDirTrendData = DirMgrData.queryIdDirTrendData;

//Manager Component
exports.viewIdMgrData = MgrCompData.viewIdMgrData;
exports.viewIdMgrCompData = MgrCompData.viewIdMgrCompData;
exports.viewIdMgrCompTrendData = MgrCompData.viewIdMgrCompTrendData;
exports.queryIdMgrData = MgrCompData.queryIdMgrData;
exports.queryIdMgrCompData = MgrCompData.queryIdMgrCompData;
exports.queryIdMgrCompTrendData = MgrCompData.queryIdMgrCompTrendData;

exports.listMetrics = UserPrefs.listMetrics;
exports.scrubberMetric = UserPrefs.scrubberMetric;
exports.metricDefnsByMetric = UserPrefs.metricDefnsByMetric;
exports.metricDefns = UserPrefs.metricDefns;
exports.viewsMappedToUser = UserPrefs.viewsMappedToUser;
exports.ViewDetails = UserPrefs.ViewDetails;
exports.getViewIDByName = UserPrefs.getViewIDByName;
exports.getViewNameByID = UserPrefs.getViewNameByID;
exports.getQueryIDByName = UserPrefs.getQueryIDByName;
exports.getQueryNameByID = UserPrefs.getQueryNameByID;
exports.updateViewTemp = UserPrefs.updateViewTemp;
exports.updateQueryTemp = UserPrefs.updateQueryTemp;
exports.getWeekEndDates = UserPrefs.getWeekEndDates;
exports.loadWeekEndDates = UserPrefs.loadWeekEndDates;
exports.exceltojson1 = UserPrefs.exceltojson1;
exports.exceltojson2 = UserPrefs.exceltojson2;
exports.listExecMetrics  = UserPrefs.listExecMetrics;
exports.getAllBUNames = UserPrefs.getAllBUNames;
exports.getBUNames = UserPrefs.getBUNames;
exports.saveEditNote=UserPrefs.saveEditNote;
exports.saveHardwareInProcessStatus=UserPrefs.saveHardwareInProcessStatus;
exports.getHardwareInProcessStatus=UserPrefs.getHardwareInProcessStatus;
exports.getReleaseScoreCardDetails=UserPrefs.getReleaseScoreCardDetails;
exports.saveScoreCardDetails=UserPrefs.saveScoreCardDetails;
exports.getEditNote=UserPrefs.getEditNote;
exports.createSparkRoom=UserPrefs.createSparkRoom;
exports.saveUserSearch=UserPrefs.saveUserSearch;
exports.getWidgetIdbyBeBu=UserPrefs.getWidgetIdbyBeBu;
exports.addBeBuMapping=UserPrefs.addBeBuMapping;
exports.removeBeBuMapping=UserPrefs.removeBeBuMapping;
exports.getUserSearch=UserPrefs.getUserSearch;
exports.TopComponents = TopX.TopComponents;
exports.TopManagers = TopX.TopManagers;
exports.GlanceDataAll = TopX.GlanceDataAll;

exports.viewIdTrendPermLink = PermanentData.viewIdTrendPermLink;
exports.queryIdTrendPermLink = PermanentData.queryIdTrendPermLink;

exports.saveMailNotif = MailNotif.saveMailNotif;
exports.getMailNotif = MailNotif.getMailNotif;
exports.sendMail = MailNotif.sendMail;
exports.sendSampleMail = MailNotif.sendSampleMail;
exports.deleteMailNotif = MailNotif.deleteMailNotif;
exports.sendScheduledMail = MailNotif.sendScheduledMail;

exports.getReleaseScoreCard = Mobile.getReleaseScoreCard;

exports.getBU = AppGlance.getBU;
exports.getOrgByBU = AppGlance.getOrgByBU;
exports.getViewsInGlance = AppGlance.getViewsInGlance;
exports.getViewsMinusGlanceViews = AppGlance.getViewsMinusGlanceViews;
exports.getViewsforViewType = AppGlance.getViewsforViewType;
exports.ViewQueryDetails = AppGlance.ViewQueryDetails;
exports.addBubble = AppGlance.addBubble;
exports.updateBubble = AppGlance.updateBubble;
exports.deleteBubble = AppGlance.deleteBubble;
exports.getViewsByOrg = AppGlance.getViewsByOrg;
