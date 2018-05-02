var winston = require('winston');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var util = require('../util');
var _ =require('underscore');
var MetricMapping = require('../../../models/widget/metric_mapping');
var UserWidgetDtls = require('../../../models/widget/user_widget_dtls');
var UserWidgetGraphDtls = require('../../../models/widget/user_widget_graph_dtls');
var Employees = require('../../../models/widget/employees');
var AppView = require('../../../models/widget/app_view');
var SendMail = require('./mailnotif');

/* listWidgets - List of Widgets for a given UserID and BU
 * */
exports.listWidgets = function (req, res) {
	var errors = util.requireFields(req.query, ['UserID']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var BUName=req.query.BuName;
	if(BUName == undefined){BUName=/.*/}
	var user_id=req.query.UserID; var widget_docs=[];
	var colors={"PUBLIC":"#AE1EE3", "ReadOnly":"#0275d8", "CoOwner":"#0275d8", "Owner":"#8a8a8a"};
	var query={$or:[
	                {$and:[{"ReadOnly.UserID":"GLOBAL"},{"ActiveFlag":"Y"}]},
	                {$and:[{'BuName':BUName},{"ActiveFlag":"Y"},{$or:[{"CreatedBy":user_id},
	                  {"ReadOnly.UserID":user_id},{"ReadOnly.UserID":"PUBLIC"},{"CoOwner.UserID":user_id}]}]}
	          ]}
	UserWidgetDtls.find(query,{"MetricDetails":0,"_id":0})
	.then(function(docs){
		if(docs.length == 0){res.jsend.success([])}
		docs.forEach(function(doc){
			var doc_mod={}; var type="";
			doc_mod=JSON.parse(JSON.stringify(doc));
			if(doc_mod["CreatedBy"] == user_id){type="Owner"; doc_mod["ShareColor"]=colors[type];}
			else{
				if(doc_mod["ReadOnly"].length != 0){
					doc_mod["ReadOnly"].forEach(function(check){
						if(check["UserID"] == "GLOBAL"){type="PUBLIC"; doc_mod["SharedType"]=type, doc_mod["ShareColor"]=colors[type];}
						else if(check["UserID"] == "PUBLIC"){type="PUBLIC"; doc_mod["SharedType"]=type, doc_mod["ShareColor"]=colors[type];}
						else if(check["UserID"] == user_id){type="ReadOnly"; doc_mod["SharedType"]=type, doc_mod["ShareColor"]=colors[type];}
					})
				}
				if(doc_mod["CoOwner"].length != 0){
					doc_mod["CoOwner"].forEach(function(check){
						if(check["UserID"] == user_id){type="CoOwner"; doc_mod["SharedType"]=type, doc_mod["ShareColor"]=colors[type];}
					})
				}
			}
			AppView.find({"ViewID":doc.ViewID},{"ViewName":1})
			.then(function(viewname){
				doc_mod["ViewName"]=viewname.length == 0 ? "": viewname[0].ViewName;
				widget_docs.push(doc_mod)
				if(widget_docs.length == docs.length)
					res.jsend.success(widget_docs)
			})
		})
	})
};

/* widgetDetails - Details of a particular widget
 * */
exports.widgetDetails = function (req, res) {
	var errors = util.requireFields(req.query, ['WidgetID']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	UserWidgetDtls.findOne(req.query,{"_id":0})
	.then(function(docs){
		return docs;
	})
	.then(res.jsend.success, res.jsend.error);
};

/* saveWidget - Save widget or edit existing widget
 * */
exports.saveWidget = function (req, res) {
	var errors = util.requireFields(req.body, ['UserID','ViewType','ViewName','ViewID','WidgetName','MetricDetails','BuName']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	if(req.body.WidgetID=="" || req.body.WidgetID==undefined){
		insertJson={"ViewType":req.body.ViewType,"ViewID":req.body.ViewID, "ViewName":req.body.ViewName,
				 "WidgetName":req.body.WidgetName,"MetricDetails":req.body.MetricDetails, "CreatedDate":new Date(),
				 "LastUpdatedDate":new Date(), "CreatedBy":req.body.UserID, "LastUpdatedBy": req.body.UserID,
				 "CoOwner":[],"ReadOnly":[],"BuName":req.body.BuName,"_id":new ObjectId(),"ActiveFlag":"Y",
		}
		UserWidgetDtls.count({"WidgetName":req.body.WidgetName})
		.then(function(count){
			if(count==0){
				UserWidgetDtls.count({"CreatedBy":req.body.UserID})
				.then(function(count){
					var WidgetID="WDGT-"+req.body.UserID+"-"+(count+1);
					insertJson["WidgetID"]=WidgetID;
					var data=new UserWidgetDtls(insertJson);
					data.save()
					.then(function(savedDoc){
						UserWidgetDtls.findOne({"WidgetID":WidgetID},{"WidgetID":1,"WidgetName":1,"_id":0})
						.then(function(doc){
							return doc;
						})
						.then(res.jsend.success, res.jsend.error)
					})
				})
			}
			else{
				var err_res="widget_name_exists";
				res.jsend.fail(err_res);
			}
		})
	}
	else{
		insertJson={"ViewType":req.body.ViewType,"ViewID":req.body.ViewID, "ViewName":req.body.ViewName,
				"WidgetName":req.body.WidgetName,"MetricDetails":req.body.MetricDetails,
				"LastUpdatedDate":new Date(), "LastUpdatedBy": req.body.UserID,	"BuName":req.body.BuName,
		}
		UserWidgetDtls.count({$and:[{"WidgetID":{$ne:req.body.WidgetID}},{"WidgetName":req.body.WidgetName}]})
		.then(function(count){
			if(count==0){
				var WidgetID=req.body.WidgetID;
				insertJson["WidgetID"]=WidgetID;
				UserWidgetDtls.update({"WidgetID":WidgetID},insertJson)
				.then(function(updatedDoc){
					UserWidgetGraphDtls.remove({"WidgetID":WidgetID})
					.then(function(remove){
						UserWidgetDtls.findOne({"WidgetID":WidgetID},{"WidgetID":1,"WidgetName":1,"_id":0})
						.then(function(doc){
							return doc
						})
						.then(res.jsend.success,res.jsend.error);
					})
				})
			}
			else{
				var err_res="widget_name_exists";
				res.jsend.fail(err_res);
			}
		})
	}
};

/* shareWidget - Share a widget
 * */
	exports.shareWidget = function (req, res) {
	//check response sending
	var errors = util.requireFields(req.body, ['WidgetID','ReadOnly','CoOwner','SharedBy']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var widget_id = req.body.WidgetID; var read_only = req.body.ReadOnly; var co_owner = req.body.CoOwner; var shared_by = req.body.SharedBy;
	var response={};
	var all_userids=read_only.concat(co_owner)
	if(all_userids[0] == "PUBLIC" || all_userids[0] == "GLOBAL"){
		all_userids.shift()
	}
	Employees.aggregate([
		{$match:{"Userid":{$in:all_userids}}},
		{$group:{_id:null, userids:{$addToSet:"$Userid"}}}
	])
	.then(function(userids){
		var diff=""
		if(userids.length == 0 && (read_only[0]=="PUBLIC" || read_only[0]=="GLOBAL")){}
		else if(userids.length == 0){diff=all_userids;}
		else{diff = _.difference(all_userids, userids[0].userids);}
		if(diff != ""){
			fail_list={"InvalidUsers":diff}
			res.jsend.fail(fail_list)
		}
		else{
			var ReadOnlyFlag=0; var CoOwnerFlag=0;
			if(read_only.length > 0){
				//if(read_only[0] == "PUBLIC"){
				if(read_only[0] == "PUBLIC" || read_only[0] == "GLOBAL"){
					//var read_arr=[{"UserID":"PUBLIC", "SharedBy":shared_by, "SharedOn":new Date()}]
					var read_arr=[{"UserID":read_only[0], "SharedBy":shared_by, "SharedOn":new Date()}]
					UserWidgetDtls.update({"WidgetID":widget_id},{$set:{"ReadOnly":read_arr}})
					.then(function(flag){
						if(flag["ok"] == 1){
							response["ReadOnly"]=1;
							//res.write(response)
						}
						else{response["ReadOnly"]=0;}
					})
				}
				else{
					var read_arr=[]

					UserWidgetDtls.aggregate([
						{$match : {"WidgetID" : widget_id}},
    				{$project : {"CreatedBy": 1,_id:0,"CoOwner.UserID":1,WidgetName:1,"ReadOnly.UserID":1}},
					])
					.then(function(userWidget){

						var co_owner_uname = []
						var read_only_uname = []

						//Check existing readOnly users
						userWidget[0].ReadOnly.forEach(function(readwid){
							read_only_uname.push(readwid.UserID);
						})

						Promise.all(read_only_uname)
						.then(function(old_re_users){

							//Loop and remove old read only users.
							for (i = 0 ; i < old_re_users.length ; i++) {
								if (read_only.indexOf(old_re_users[i]) > -1){
									read_only.splice(read_only.indexOf(old_re_users[i]));
								}
							}

							//manipulte the array
							read_only.forEach(function(read_user){
								var read_json={"UserID":read_user, "SharedBy":shared_by, "SharedOn":new Date()}
								read_arr.push(read_json)
							})

							///Update the same in Mongo
							UserWidgetDtls.update({"WidgetID":widget_id},{$addToSet:{"ReadOnly":{$each:read_arr}}})
							.then(function(flag){
								UserWidgetDtls.update({"WidgetID":widget_id},{$pull:{"CoOwner":{"UserID":{$in:read_only}}}})
								.then(function(flag){
									if(flag["ok"] == 1){
										response["ReadOnly"]=1;
										//res.write(response)
									}
									else{
										response["ReadOnly"]=0;}
								})
							})

							//Pick of list of Co_Owners to put in cc
							userWidget[0].CoOwner.forEach(function(userwid){
								co_owner_uname.push(userwid.UserID);
							})

							//Trigger Mail to respected users
							Promise.all(co_owner_uname)
							.then(function(co_owners){
								if (read_only.length > 0) {
									SendMail.sendSharedWidgetMail(shared_by, read_only, userWidget[0].WidgetName,co_owners,"ReadOnly",userWidget[0].CreatedBy,userWidget[0].ViewID );
								}
							})
						})
					})
				}
			}

			if(co_owner.length > 0){
				var co_owner_arr=[]

				UserWidgetDtls.aggregate([
					{$match : {"WidgetID" : widget_id}},
					{$project : {"CreatedBy": 1,_id:0,"CoOwner.UserID":1,WidgetName:1}},
				])
				.then(function(userWidget){
					var co_owner_uname = []
					userWidget[0].CoOwner.forEach(function(userwid){
						co_owner_uname.push(userwid.UserID);
					})

					Promise.all(co_owner_uname)
					.then(function(old_co_owners){

							//Remove redundant co-owners
							for (i = 0 ; i < old_co_owners.length ; i++) {
								if (co_owner.indexOf(old_co_owners[i]) > -1){
									co_owner.splice(co_owner.indexOf(old_co_owners[i]));
								}
							}

							//manipulte array
							co_owner.forEach(function(co_owner_user){
								var co_owner_json={"UserID":co_owner_user, "SharedBy":shared_by, "SharedOn":new Date()}
								co_owner_arr.push(co_owner_json)
							})

							//update the same in mongo
							UserWidgetDtls.update({"WidgetID":widget_id},{$addToSet:{"CoOwner":{$each:co_owner_arr}}})
							.then(function(flag){
								UserWidgetDtls.update({"WidgetID":widget_id},{$pull:{"ReadOnly":{"UserID":{$in:co_owner}}}})
								.then(function(flag){
									if(flag["ok"] == 1){
										response["CoOwner"]=1;
										//res.write(response)
										//res.end();
									}
									else{response["CoOwner"]=0;}
								})
							})

							//Trigger mail to old co-owners
							if (co_owner.length > 0) {
									SendMail.sendSharedWidgetMail(shared_by, co_owner, userWidget[0].WidgetName,old_co_owners,"Co-Owner",userWidget[0].CreatedBy );
							}
					})
				})
			}
			res.jsend.success({"Shared":1})
		}
	})
};

/* unshareWidget - Unshare widget
 * */
exports.unshareWidget = function (req, res) {
	var errors = util.requireFields(req.body, ['WidgetID','UserIDS']);
	var widget_id = req.body.WidgetID;
	var user_ids = req.body.UserIDS;
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	UserWidgetDtls.update({"WidgetID":widget_id},{$pull:{"ReadOnly":{"UserID":{$in:user_ids}}}})
	.then(function(readflag){
		UserWidgetDtls.update({"WidgetID":widget_id},{$pull:{"CoOwner":{"UserID":{$in:user_ids}}}})
		.then(function(coflag){
			res.jsend.success({"Unshared":1})
		})
	})
};

/* deleteWidget - Delete Widget, only by owner
 * */
exports.deleteWidget = function (req, res) {
	var errors = util.requireFields(req.body, ['WidgetID','UserID']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var widget_id = req.body.WidgetID;
	var user_id = req.body.UserID;
	UserWidgetDtls.findOne({"WidgetID":widget_id},{"WidgetID":1,"CreatedBy":1,"ReadOnly":1,"CoOwner":1,"_id":0})
	.then(function(doc){
		if(doc["CreatedBy"] == user_id){
			UserWidgetDtls.update({"WidgetID":widget_id},{$set:{"ActiveFlag":"N"}})
			.then(function(delflag){
				UserWidgetDtls.update({"WidgetID":widget_id},{$set:{"ReadOnly":[]}})
				.then(function(readflag){
					UserWidgetDtls.update({"WidgetID":widget_id},{$set:{"CoOwner":[]}})
					.then(function(coflag){
						res.jsend.success({"Deleted":1})
					})
				})
			})
		}
		else{
			UserWidgetDtls.update({"WidgetID":widget_id},{$pull:{"ReadOnly":{"UserID":user_id}}})
			.then(function(readflag){
				UserWidgetDtls.update({"WidgetID":widget_id},{$pull:{"CoOwner":{"UserID":user_id}}})
				.then(function(coflag){
					res.jsend.success({"deleted":1})
				})
			})
		}
	})
};


//Getting graph preferences for a user and for a widget
exports.getWidgetGraphData = function(req, res) {
	var errors = util.requireFields(req.body, ['UserID','WidgetID','Primary','Hierarchy']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var user_id=req.body.UserID; var widget_docs=[], key; var key2={}
	if(req.body.Primary == "Y") {
		hierKeyMapping = {"Org":"OverallOrgGraphs","Comp":"OverallCompGraphs","Pin":"OverallPinGraphs","Dir":"OverallDirGraphs"}
		if(hierKeyMapping[req.body.Hierarchy] != undefined){
			key = hierKeyMapping[req.body.Hierarchy];
		} else
			res.jsend.fail({"Hierarchy":"Invalid value"});
	} else if(req.body.Primary == "N") {
		hierKeyMapping = {"Org":"SubviewOrgGraphs","Comp":"SubviewCompGraphs","Pin":"SubviewPinGraphs","Dir":"SubviewDirGraphs"}
		if(hierKeyMapping[req.body.Hierarchy] != undefined)
			key = hierKeyMapping[req.body.Hierarchy];
		else
			res.jsend.fail({"Hierarchy":"Invalid value"});
	} else
		res.jsend.fail({"Primary":"Invalid value"});
	var query = {$and:[{'UserID':req.body.UserID},{"WidgetID":req.body.WidgetID}]};
	var cond = {"UserID":1,'WidgetID':1,"_id":0};
	cond[key] = 1;
	UserWidgetGraphDtls.findOne(query,cond)
	.then(function(docs){
		//If no graphs are saved in the name of user, then return graphs saved by widget owner
		if(docs == null || docs[key].length == 0) {
			UserWidgetDtls.findOne({"WidgetID":req.body.WidgetID},{"WidgetID":1, "CreatedBy":1}).then(function(widgetDoc){
				UserWidgetGraphDtls.findOne({$and:[{'UserID':widgetDoc.CreatedBy},{"WidgetID":req.body.WidgetID}]},cond)
				.then(function(docs) {
					//If widget owner has not saved any graphs, then return empty object
					if(docs == null)
						res.jsend.success({});
					else {
						var temp = JSON.parse(JSON.stringify(docs));
						//Indicates that graphs returned are those saved by owner
						temp["IfSavedByOwner"] = true;
						temp["GraphDetails"] = docs[key];
						delete temp[key];
						res.jsend.success(temp);
					}
				});
			});
		} else {
			var temp = JSON.parse(JSON.stringify(docs));
			temp["GraphDetails"] = docs[key];
			temp["IfSavedByOwner"] = false;
			delete temp[key];
			res.jsend.success(temp);
		}
	}).then(res.jsend.success, res.jsend.error)
};

//Saving graph preferences for a user and for a widget
exports.saveWidgetGraphData = function(req, res) {
	var errors = util.requireFields(req.body, ['UserID','WidgetID','Primary','Hierarchy','GraphDetails']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var user_id=req.body.UserID; var widget_id=req.body.WidgetID;var graph_details = req.body.GraphDetails;var key;
	if(req.body.Primary == "Y") {
		hierKeyMapping = {"Org":"OverallOrgGraphs","Comp":"OverallCompGraphs","Pin":"OverallPinGraphs","Dir":"OverallDirGraphs"}
		if(hierKeyMapping[req.body.Hierarchy] != undefined)
			key = hierKeyMapping[req.body.Hierarchy];
		else
			res.jsend.fail({"Hierarchy":"Invalid value"});
	} else if(req.body.Primary == "N") {
		hierKeyMapping = {"Org":"SubviewOrgGraphs","Comp":"SubviewCompGraphs","Pin":"SubviewPinGraphs","Dir":"SubviewDirGraphs"}
		if(hierKeyMapping[req.body.Hierarchy] != undefined)
			key = hierKeyMapping[req.body.Hierarchy];
		else
			res.jsend.fail({"Hierarchy":"Invalid value"});
	} else
		res.jsend.fail({"Primary":"Invalid value"});

	var query = {$and:[{'UserID':req.body.UserID},{"WidgetID":req.body.WidgetID}]};
	UserWidgetGraphDtls.findOne({'UserID':req.body.UserID,"WidgetID":req.body.WidgetID})
		.then(function(doc){
			if(doc == null || doc == undefined) {
				insertJson = {"UserID" : user_id, "WidgetID" : widget_id, "_id":new ObjectId(),"CreatedDate":new Date(),
				 "LastUpdatedDate":new Date()};
				insertJson[key] = graph_details;
				var data=new UserWidgetGraphDtls(insertJson);
				data.save()
				.then(function(savedDoc) {
					UserWidgetGraphDtls.findOne({'UserID':req.body.UserID,"WidgetID":req.body.WidgetID},{"UserID":1,'WidgetID':1,"_id":0})
					.then(function(doc){
						return doc;
					})
					.then(res.jsend.success, res.jsend.error)
				},res.jsend.fail)
			} else {
				doc[key] = graph_details;
				doc["LastUpdatedDate"] = new Date();

				UserWidgetGraphDtls.update({'UserID':user_id,"WidgetID":widget_id},doc)
				.then(function(updatedDoc){
					UserWidgetGraphDtls.findOne({"WidgetID":widget_id, 'UserID':user_id},{"UserID":1,'WidgetID':1,"_id":0})
					.then(function(doc){
						return doc;
					}).then(res.jsend.success, res.jsend.error)
				}, res.jsend.fail)
			}
		});
};

/**
*	list widget for bubble
**/
exports.listPublicWidgets = function(req, res) {
	var errors = util.requireFields(req.query, ['ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}

	var BUName = req.query.BUName;
	if(BUName == undefined){
		BUName=/.*/
	}

	var ViewType =  req.query.ViewType;
	var widget_docs=[];

	//Pick filters based on query
	var query = {$and :[{"ActiveFlag":"Y"},
											{"ViewType":ViewType},
											{$or : [
													 {$and : [{'BuName':BUName},{"ReadOnly.UserID":"PUBLIC"}]},
													 {"ReadOnly.UserID":"GLOBAL"}
											]},
							]}

	UserWidgetDtls.find(query,{_id:0,"WidgetID":1,"WidgetName":1,"ViewType":1})
	.then(function(data){
		return data;
	}).then(res.jsend.success, res.jsend.error);

};
