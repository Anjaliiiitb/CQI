var config = require('config');
var winston = require('winston');
var util = require('../util');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var _ = require('underscore');
var AppGlance = require('../../../models/widget/app_oq_rel_bu_mapping');
var AppView = require('../../../models/widget/app_view');
var AppBuList = require('../../../models/widget/app_bu_list');
var AppBrdgViewQuery= require('../../../models/widget/app_brdg_view_query');
var AppQuery=require('../../../models/widget/app_query');

/* getBU - List all BU with BuIDs
 * */
exports.getBU = function (req, res) {
    AppBuList.find({ "ActiveFlag": "Y" }, { "BU": 1, "BuID": 1 })
    .then(function (docs) {
        return docs;
    })
    .then(res.jsend.success, res.jsend.error);
}

/* getOrgByBU - List all Org and OrgOrder based on BU
 * */
exports.getOrgByBU = function (req, res) {
  var errors = util.requireFields(req.body, ['ViewType']);
  if (errors){ res.jsend.fail(errors); return; }
  var BU=req.body.BU; var BuID=req.body.BuID; var query={"ActiveFlag":"Y"};
    var viewType = req.body.ViewType;
	  if(BuID == undefined && BU == undefined){res.jsend.fail("BU or BuID missing"); return;}

    if(BU != undefined){
        query["BU"]=BU
    }
    else if(BuID != undefined){
      query["BuID"]=BuID
    }

    query["ViewType"] = viewType;

    AppGlance.aggregate([
      {$match : query},
      {$group : {_id : {"Org": "$Org" , "OrgOrder" : "$OrgOrder"}}},
      {$project : {"Org": "$_id.Org" , "OrgOrder" : "$_id.OrgOrder","_id":0}},
      {$sort : {"OrgOrder":1}}
    ])
    .then(function (docs) {
        return docs;
    })
    .then(res.jsend.success, res.jsend.error);
}

/* getViewsInGlance - Get all views in glance view based on view type
 * */
exports.getViewsInGlance = function (req, res) {
    var errors = util.requireFields(req.body, ['ViewType']);
    if (errors){ res.jsend.fail(errors); return; }
    view_type=req.body.ViewType;
    AppGlance.find({$and:[{"ViewType":view_type},{"ActiveFlag":"Y"}]},{"_id":1,"ViewID":1,"ViewOrder":1,"BU":1,"OrgOrder":1,"BuID":1,"Org":1})
    .then(function (view_data) {
    	if(view_data.length == 0){res.jsend.success([]); return;}
        var viewids = []; var view_names={}; var view_created={};
        view_data.forEach(function(item){ viewids.push(item.ViewID) });
        AppView.aggregate([
			{$match:{"ViewID":{$in:viewids}}},
			{$project:{"ViewID":1, _id:0, "ViewName":1, "CreatedBy":1}}
		])
        .then(function(views){
        	views.forEach(function(view){
        		view_names[view["ViewID"]]=view["ViewName"]
        		view_created[view["ViewID"]]=view["CreatedBy"]
        	})
        	var data = JSON.parse(JSON.stringify(view_data));
            data.forEach(function (item) {
            	item["ViewName"]=view_names[item["ViewID"]];
            	item["CreatedBy"]=view_created[item["ViewID"]];
            })
            return data;
        })
        .then(res.jsend.success, res.jsend.error);
    })
};

/* getViewsMinusGlanceViews - Get all views from app_view minus the ones present in glance table
 * for both BU and ViewType
 *  */
exports.getViewsMinusGlanceViews = function(req,res){
    var errors = util.requireFields(req.body, ['BU', 'ViewType']);
    if (errors) {
        res.jsend.fail(errors);
        return;
    }
    var BU=req.body.BU; var view_type=req.body.ViewType;
    AppGlance.aggregate([
		{$match:{"BU":BU, "ViewType":view_type, "ActiveFlag":"Y"}},
		{$group:{_id:null, ViewIDS:{$addToSet:"$ViewID"}}}
	])
    .then(function(glance_views){
      console.log(glance_views);
      if (glance_views[0] == undefined ) {
        return AppView.find({"BuName":BU, "ViewType":view_type, "ActiveFlag":"Y"},
      			{"ViewID":1,"ViewName":1,"_id":0})
  	    .then(function (views) {
  	    	return views
  	    })
      } else {
      	return AppView.find({"BuName":BU, "ViewType":view_type, "ActiveFlag":"Y", "ViewID":{$nin:glance_views[0]["ViewIDS"]}},
      			{"ViewID":1,"ViewName":1,"_id":0})
  	    .then(function (views) {
  	    	return views
  	    })
      }
    }).then(res.jsend.success, res.jsend.error);

};

/*
* addBubble - To save Bubble details for a release (ViewID)
*/
exports.addBubble = function(req, res){
	  var errors = util.requireFields(req.body, ["ViewID","BU","ViewType","ViewOrder","Org"]);
    //var widgetId = req.body.WidgetID;

    if (errors) {res.jsend.fail(errors);return;}
    var inputData = req.body;
    AppGlance.distinct("OrgOrder",{"Org":inputData["Org"],"BU":inputData["BU"],"ViewType":inputData["ViewType"],"ActiveFlag":"Y"})
    .then(function(data){
        if(data.length != 0){
          inputData["OrgOrder"] = data[0];

          var record = new AppGlance(inputData);
          record.save().then(res.jsend.success,res.jsend.error);

        }
        else {
          AppGlance.aggregate([
            {$match:{BU:inputData["BU"], ViewType:inputData["ViewType"],ActiveFlag:"Y"}},
            {$group:{_id:null, max:{$max:"$OrgOrder"}}}
            //{$group : {_id : {"Org":inputData["Org"],"BU":inputData["BU"],"ViewType":inputData["ViewType"]}, max : {$max : "$OrgOrder"}}}
          ])
          .then(function(docs){
            if (docs.length > 1) {
                inputData["OrgOrder"] = ( docs[0].max == undefined ? 0 :docs[0].max )+ 1;
            } else {
              inputData["OrgOrder"] = 1;
            }

            var record = new AppGlance(inputData);
            return record.save();

          }).then(res.jsend.success,res.jsend.error)
        }
    })

};

/* updateBubble - To update Bubble details for a release (ViewID)
* */
exports.updateBubble = function(req, res){
  //bubble update operation
    var errors = util.requireFields(req.body, ["ViewID","ViewOrder","Org","_id"]);
  	if (errors) {res.jsend.fail(errors);return;}

    var set = { "Org": req.body.Org, "ViewOrder": req.body.ViewOrder, "ViewID" : req.body.ViewID }

    AppGlance.update({ "_id": req.body._id,"ActiveFlag" : "Y" }, { $set: set })
  	.then(function (upd) {
  		if (upd["ok"] == 1){ res.jsend.success("Update Success"); }
  		else { res.jsend.error("Udpate Failed"); }
  	})

};

/* deleteBubble - To delete Bubble details for a release (ViewID)
 * */
exports.deleteBubble = function(req, res){
	var errors = util.requireFields(req.body, ["_id"]);
	if (errors) {res.jsend.fail(errors);return;}
	AppGlance.updateMany({"_id": {$in : req.body._id}},{$set:{"ActiveFlag":"N"}})
	.then(function(del){
		if(del["ok"] == 1){res.jsend.success("Deleted")}
		else {res.jsend.error("Error")}
	})
};

exports.getViewsforViewType = function(req, res){
	var errors = util.requireFields(req.body, ["ViewType"]);
	if (errors) {res.jsend.fail(errors);return;}
	var view_type=req.body.ViewType;
	AppView.aggregate([
		{$match:{"ViewType":view_type, "ActiveFlag":"Y"}},
		{$project:{"ViewID":1, "ViewName":1, _id:0}}
	])
	.then(function(data){
		return data
	})
	.then(res.jsend.success, res.jsend.error)
};

//Gives all the details of a view based on ViewID or ViewIDOrName
exports.ViewQueryDetails = function(req, res){
	var errors = util.requireFields(req.body, ["ViewIDOrName"]);
	var matchString, matchCriteria = "id";
	//One of ViewID or ViewIDOrName is mandatory
	if (errors) {
		var errors2 = util.requireFields(req.body, ["ViewID"]);
		if(errors2) {res.jsend.fail(errors2);return;}
	} else {
		matchCriteria = "idOrName";
	}

	var view_id=req.body.ViewID;
	var view_id_or_name = req.body.ViewIDOrName;
	if(matchCriteria == "id" )
		matchString = {"ViewID":view_id, "ActiveFlag":"Y"};
	else if(matchCriteria == "idOrName")  {
		matchString = {"$or":[{"ViewID":view_id_or_name},{"ViewName":view_id_or_name}]};
	}

	AppView.aggregate([
   		{$match:matchString},
   		{$project:{"ViewID":1, "ViewName":1, "CreatedBy":1, "BuName":1, "ReadOnlyUser":"$ReadOnlyUser.UserID", "CoOwner":"$CoOwner.UserID", "UpdatedOn":1,"ViewType":1, _id:0}}
   	])
   	.then(function(data){
   		if(data.length == 0){res.jsend.fail("View Invalid or Inactive"); return;}
   		var view_data=JSON.parse(JSON.stringify(data[0]));
   		AppBrdgViewQuery.aggregate([
	   		{$match:{_id:view_data.ViewID}},
	   		{$unwind:"$Queries"},
	   		{$lookup:{from:"app_query", localField:"Queries.QueryID", foreignField:"QueryID", as:"temp"}},
	   		{$project:{"QueryID":"$Queries.QueryID", "Primary":"$Queries.Primary", "QueryType":"$Queries.QueryType",
	   		  "temp2":{$arrayElemAt:["$temp",0]}}},
	   		{$project:{ViewID:"$_id", _id:0, "QueryID":"$QueryID", "Primary":"$Primary", "QueryType":"$QueryType",
	   			"CreatedBy":"$temp2.CreatedBy", "CreatedOn":"$temp2.CreatedOn", "UpdatedOn":"$temp2.UpdatedOn", "QueryName":"$temp2.QueryName",
	   			 "BuName":"$temp2.BuName", "QueryDefinition":"$temp2.QueryDefinition","CoOwner":"$temp2.CoOwner.UserID","LastRefreshDate":"$temp2.LastRefreshDate"}},
	   		{$group:{_id:"$ViewID", Queries:{$addToSet:{"QueryID":"$QueryID", "Primary":"$Primary", "QueryType":"$QueryType",
	   			"CreatedBy":"$CreatedBy", "CreatedOn":"$CreatedOn", "UpdatedOn":"$UpdatedOn", "QueryName":"$QueryName",
	   			"BuName":"$BuName", "QueryDefinition":"$QueryDefinition","CoOwner":"$CoOwner","LastRefreshDate":"$LastRefreshDate"}}}},
	   		{$project:{"ViewID":"$_id", _id:0, Queries:1}}
	   	])
	   	.then(function(query_data){
	   		view_data["Queries"]=query_data[0]["Queries"];
	   		return view_data
	   	})
	   	.then(res.jsend.success, res.jsend.fail);
   	})
};


/*
* display views for a givne BU viewType and org
*/
exports.getViewsByOrg = function(req, res) {
  var errors = util.requireFields(req.body, ["BU","ViewType"]);
  if (errors) {res.jsend.fail(errors);return;}
  var viewType = req.body.ViewType;
  var BU = req.body.BU;
  var org = req.body.Org;
  var viewId = req.body.ViewID;
  var filter = {};
  filter["ViewType"] = viewType;
  filter["BU"] = BU;
  filter["ActiveFlag"]="Y";

  if (org != undefined) {
    filter["Org"] = org;
  } else if (viewId != undefined) {
    filter["ViewID"] = viewId;
  }

  AppGlance.aggregate([
		{$match : filter},
    {$lookup : {from : "app_view",localField:"ViewID",foreignField:"_id",as:"viewName"}},
		{$project : {"ViewID":1, _id:0,"ViewOrder":1,
          "ViewName":{ $arrayElemAt: [ "$viewName.ViewName", 0 ] }}},
    {$lookup : {from : "app_brdg_view_query", localField:"ViewID",foreignField : "ViewID", as:"temp"}},
    {$project : {"ViewID":1, "ViewOrder":1,"ViewName":1,
          "Queries":{ $arrayElemAt: ["$temp.Queries",0]}}},
    {$unwind: "$Queries"},
    {$match : { $and: [{ "Queries.QueryType": { $in: ["Defect", "BugBackLog"] } }, { "Queries.Primary": "Y" }] }},
    {$lookup : {from : "app_query",localField:"Queries.QueryID",foreignField:"_id", as:"temp2"}},
    {$sort : {"ViewOrder" : 1}},
    {$project: {"ViewID":1,"ViewName":1,
          "LastRefreshDate":{ $arrayElemAt: ["$temp2.LastRefreshDate",0]}}},
	]).then(function(docs)
  {
    return docs;
  })
  .then(res.jsend.success,res.jsend.error)
};
