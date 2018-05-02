var util = require('../util');
var ReleaseMilestone = require('../../../models/widget/release_milestone');
var AppView=require('../../../models/widget/app_view');

/* getMilestones - To get all the active milestones linked to a release (ViewID)
 * */
exports.getMilestones = function(req, res){
	var errors = util.requireFields(req.query, ['ViewID']);
	if (errors) {res.jsend.fail(errors);return;}
	var view_id=req.query.ViewID;
	ReleaseMilestone.find({"ViewID":view_id,"ActiveFlag":"Y"},{"MilestoneName":1,"MilestoneDate":1,"MilestoneID":1,"_id":0})
	.then(function(milestones){
		return milestones;
	})
	.then(res.jsend.success, res.jsend.error)
};

/* saveMilestone - To save milestone details for a release (ViewID)
 * Only Owner / CoOwner for the ViewID has access to add new milestones
 * Milestone Name is unique for a Release
 * */
exports.saveMilestone = function(req, res){
	var errors = util.requireFields(req.body, ['MilestoneName','ViewID','Date','UserID']);
	if (errors) {res.jsend.fail(errors);return;}
	var milestone_name=req.body.MilestoneName; var view_id=req.body.ViewID; var date=req.body.Date; var user_id=req.body.UserID;
	var access_flag=0; var current_date=new Date(); var milestone_id=0;
	AppView.findOne({"ViewID":view_id},{"ViewName":1, "CoOwner.UserID":1,"CreatedBy":1})
	.then(function(view){
		if(view == null){res.jsend.fail("View Invalid or Inactive"); return;}
		if(view["CreatedBy"] == user_id){access_flag=1}
		else if(view["CoOwner"] != []){
			view["CoOwner"].forEach(function(user){if(user["UserID"] == user_id){access_flag=1}})
		}
		if(access_flag == 1){
			ReleaseMilestone.find({"MilestoneName":milestone_name, "ViewID":view_id},{_id:0,"MilestoneName":1})
			.then(function(name_exists){
				if(name_exists.length == 0){
					ReleaseMilestone.count()
					.then(function(count){
						milestone_id=count+1;
						var insert_json={"MilestoneName":milestone_name, "MilestoneID":milestone_id, "MilestoneDate":date,
								"ViewID":view_id, "CreatedBy":user_id, "LastUpdatedBy":user_id, "CreatedDate": current_date,
								"LastUpdatedDate":current_date, "ActiveFlag":"Y", "_id":milestone_id};
						var data=new ReleaseMilestone(insert_json);
						data.save()
						.then(function(savedDoc){
							return {"MilestoneID":savedDoc["MilestoneID"]}
						})
						.then(res.jsend.success, res.jsend.error)
					})
				}
				else{res.jsend.fail("Milestone name already exists")}
			})
		}
		else {res.jsend.fail("No access to save")};
	})
};

/* deleteMilestone - To delete milestone details for a release (ViewID) 
 * Only Owner / CoOwner for the ViewID has access to delete
 * */
exports.deleteMilestone = function(req, res){
	var errors = util.requireFields(req.body, ['MilestoneID','ViewID','UserID']);
	if (errors) {res.jsend.fail(errors);return;}
	var milestone_id=req.body.MilestoneID; var view_id=req.body.ViewID; var user_id=req.body.UserID;
	var access_flag=0;
	AppView.findOne({"ViewID":view_id},{"CoOwner.UserID":1,"CreatedBy":1})
	.then(function(view){
		if(view["CreatedBy"] == user_id){access_flag=1}
		else if(view["CoOwner"] != []){
			view["CoOwner"].forEach(function(user){if(user["UserID"] == user_id){access_flag=1}})
		}
		if(access_flag == 1){
			ReleaseMilestone.update({"MilestoneID":milestone_id},{$set:{"ActiveFlag":"N"}})
			.then(function(del){
				if(del["ok"] == 1){res.jsend.success("Deleted")}
				else {res.jsend.error("Error")}
			})
			}
		else {res.jsend.fail("No access to delete")};
	})
};