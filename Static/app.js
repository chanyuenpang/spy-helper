var isDesktop = false;
var isTablet = false;
var isPhone = false;

$(document).ready(function(){
	isDesktop = $('#divIsDesktop').css('display') != 'none';
	isTablet = $('#divIsTablet').css('display') != 'none';
	isPhone = !isDesktop && !isTablet;
	goLogin();
});

function login(){
	var roomID = verifyInput('#txtRoomID',null);
	if(!roomID) roomID = 'default';
	var name = verifyInput('#txtName','Player Name Could not be empty.');
	if(!name) return;
	var psw = verifyInput('#txtRoomPsw',null);
	if(!psw) psw = '@';
	show_info('vInfo','Loging...','info');
	roomID = roomID.toLowerCase();
	name = name.toLowerCase();
	DM.Login(roomID,psw,name);
}

function submitTopic(){

};

function finishGame(){
	DM.Finish();
}

function verifyInput(selector,failMsg, length){
	var value = $(selector).val();
	if(value) {
		value = value.trim();
		if(!length) length = 0;
		if(value.length == length) {
			if(failMsg) show_info('vInfo',failMsg,'error');
			return null;
		}
	} else {
		if(failMsg) show_info('vInfo',failMsg,'error');
		return null;
	}
	return value;
}

function goLogin(){
	DM.PlayerStatus = PlayerStatus.NoLogin;
	$('#wrapper').load('login.html', null, function(){
		$('#txtRoomID').val(DM.RoomID);
		$('#txtName').val(DM.PlayerName);
	});
}

function goCreateTopic(){
	$('#wrapper').load('createtopic.html', null, function(){
		DM.PlayerStatus = PlayerStatus.CreatingTopic;
	});
}

function goFollowTopic(){
	$('#wrapper').load('followtopic.html', null, function(){
		if(DM.RoomData.topic){
			$('#lbTopic').html(DM.RoomData.topic.content);
			$('.invisible').removeClass('invisible');
			DM.PlayerStatus = PlayerStatus.FollowingTopic;
		} else {
			DM.PlayerStatus = PlayerStatus.WaittingTopic;
		}
	});
}

function goTopic(){
	$('#wrapper').load('topic.html', null, function(){
		DM.PlayerStatus = PlayerStatus.Playing;
		if(DM.PlayerCount < 3) {
			show_info('vInfo','The game requires at least 3 player.','info');
			return;
		}
	});
}

function goChoise(){
	$('#wrapper').load('choice.html', null, function(){
		DM.PlayerStatus = PlayerStatus.Choosing;
		showResult();
		if(DM.RoomData.finish >= DM.PlayerCount && DM.IsHost) DM.ClearUp();
	});
}

function showResult(){

}

//显示系统信息
function show_info(div_id, msg, type, auto_hide)
{
	type = (type == null ? '' : ' alert-' + type);
	var a = $('#' + div_id);
	a.clearQueue();
	a.removeClass();
	a.addClass('alert' + type);
	$('#' + div_id + '>p').html(msg);
	a.fadeIn();
	if(auto_hide)
	{
		a.delay(2000);
		a.fadeOut(350);
	}
	return a;
}

//打印 对象
function dump_obj(myObject)
{
	var s = "";
	for (var property in myObject) {
		s = s + "\n "+property +": " + myObject[property];
	}
	console.log(s);
}

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.format = function(fmt)
{
	//author: meizz
	var o = {
		"M+" : this.getMonth()+1,                 //月份
		"d+" : this.getDate(),                    //日
		"h+" : this.getHours(),                   //小时
		"m+" : this.getMinutes(),                 //分
		"s+" : this.getSeconds(),                 //秒
		"q+" : Math.floor((this.getMonth()+3)/3), //季度
		"S"  : this.getMilliseconds()             //毫秒
	};
	if(/(y+)/.test(fmt))
		fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
	for(var k in o)
		if(new RegExp("("+ k +")").test(fmt))
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
	return fmt;
}

String.prototype.trim=function(){
	return this.replace(/(^\s*)|(\s*$)/g, "");
}
String.prototype.ltrim=function(){
	return this.replace(/(^\s*)/g,"");
}
String.prototype.rtrim=function(){
	return this.replace(/(\s*$)/g,"");
}

function RequestPermission(callback) {
	window.webkitNotifications.requestPermission(callback);
}

function notify(title, content) {
	if (!window.webkitNotifications)
		show_info('vInfo',content,'success',true);
	else if (window.webkitNotifications.checkPermission() > 0) {
		RequestPermission(notify);
	} else {
		notification = window.webkitNotifications.createNotification($('#vProfileImage').attr('src'), title, content);
		notification.show();
		setTimeout(function(){
			notification.cancel();
		},'3000');
	}
}


/**
 * Created with JetBrains WebStorm.
 * User: Yop Chan
 * Date: 13-1-9
 * Time: 下午9:34
 * To change this template use File | Settings | File Templates.
 */

var PlayerStatus = {
	NoLogin : 0,
	WaittingTopic : 1,
	CreatingTopic : 2,
	FollowingTopic : 3,
	Playing : 4,
	Choosing : 5
};

var DM = {
	Debug : false,
	RootRef : 'https://who.firebaseIO.com/Tool/',
	RoomTerm : 'Rooms',
	PListTerm : 'players',
	FoTopicTerm : 'FoTopics',
	IsHost : false,
	PlayerName : '',
	RoomID : '',
	RoomPsw : '@',
	RoomData : null,
	PlayerCount : 0,
	PlayerStatus : 0,

	Init : function(){

	},

	Login : function(roomID,psw,name){
		DM.PlayerName = name;
		DM.RoomID = roomID;
		DM.RoomPsw = psw;

		var fb = new Firebase(this.RootRef + this.RoomTerm).child(roomID);
		fb.transaction(function(room){
			if(room){
				if(!room.players){
					room = null;
				}
			}
			if(!room){
				room = {
					psw:psw,
					host:name,
					created:(new Date()).format('yyyy-MM-dd'),
					creator:name,
					finish:0
				};
				room.players = new Object();
				room.players[name] = false;
			}
			return room;
		}, function(success,snap){
			var room = snap.val();
			if(!success){
				return;
			}
			if(room.psw != psw){
				show_info('vInfo', roomID === 'defalut' ? "Default room is taken, please create a new room." : "Password's not right",'error');
				goLogin();
				return;
			}
			else if(room.players && room.players[name]) {
				show_info('vInfo',"User's already online",'error');
				goLogin();
				return;
			}

			DM.RoomData = room;
			DM.DoneLogin();
			if(room.host == DM.PlayerName){
				DM.MakeHost();
				show_info('vInfo',"You've created a new room "+roomID,'success',true);
				goCreateTopic();
			}
			else {
				show_info('vInfo',"You've entered the room "+roomID,'success',true);
				goFollowTopic();
			}
		});
	},

	DoneLogin : function(){
		var fb = new Firebase(this.RootRef + this.RoomTerm).child(DM.RoomID);
		fb.on('value',DM.UpdateStatus);

		fb = fb.child(DM.PListTerm);
		fb.child(DM.PlayerName).set(true);
		fb.child(DM.PlayerName).removeOnDisconnect();
		fb.on('child_removed', DM.PlayerChanged);
		DM.PlayerStatus = (DM.IsHost ? PlayerStatus.CreatingTopic : PlayerStatus.WaittingTopic);
	},

	UpdateStatus : function(snap){
		DM.RoomData = snap.val();
		DM.PlayerCount = snap.child(DM.PListTerm).numChildren();

		switch(DM.PlayerStatus){
			case PlayerStatus.WaittingTopic:
				if(DM.RoomData.topic){
					$('#lbTopic').html(DM.RoomData.topic.content);
					$('.invisible').removeClass('invisible');
					DM.PlayerStatus = PlayerStatus.FollowingTopic;
				}
				if(DM.RoomData.gametopics){
					goTopic();
				}
				break;
			case PlayerStatus.FollowingTopic:
				if(DM.RoomData.gametopics){
					goTopic();
				}
				break;
			case PlayerStatus.Playing:
				if(DM.PlayerCount < 3) {
					show_info('vInfo','The game requires at least 3 player.','info');
					return;
				}
				var submited = snap.child(DM.FoTopicTerm).numChildren();
				if((submited >= DM.PlayerCount - 1)){
					if(!DM.RoomData.gametopics) DM.GenTopic(snap);
					else {
						$('#lbTopic').html(DM.RoomData.spy == DM.PlayerName ? DM.RoomData.gametopics.subtopic.content : DM.RoomData.gametopics.mtopic.content);
					}
				}
				break;
			case PlayerStatus.Choosing:
				if(DM.RoomData.finish >= DM.PlayerCount && DM.IsHost) DM.ClearUp();
			default:
				break;
		}
	},

	GenTopic : function(snap){
		var mTopic = null;
		var subTopic = null;
		var topicStatis = new Object();
		var spy = null;
		snap.child(DM.FoTopicTerm).forEach(function(data){
			var topic = data.val();
			if(!topicStatis[topic.content]) topicStatis[topic.content] = 1;
			else topicStatis[topic.content]++;

			if(!mTopic) mTopic = topic;
			else if(topic.content !== mTopic.content) {
				if(!subTopic) subTopic=topic;
				else if(topicStatis[topic.content] <= topicStatis[mTopic.content]){
					subTopic = mTopic;
					mTopic = topic;
				}
			}
		});
		if(!subTopic){
			show_info('vInfo','Wired, your topics are all the same, please re-submit a topic.',null);
			goFollowTopic();
		} else {
			var skip = subTopic.creator;
			var random = Math.round((1+Math.random())*1024)%(DM.PlayerCount-1);
			for(var player in DM.RoomData.players){
				if(player !== skip){
					if(random == 0) {
						spy = player;
						break;
					} else random--;
				}
			}
		}
		if(DM.IsHost){
			var fb = new Firebase(DM.RootRef + DM.RoomTerm).child(DM.RoomID);
			var gameTopics = {mtopic:mTopic,subtopic:subTopic};
			fb.update({spy:spy,gametopics:gameTopics},function(success){
				if(!success) updateStatus(snap);
				else {
					DM.RoomData.spy = spy;
					DM.RoomData.gametopics = gameTopics;
					$('#lbTopic').html(DM.RoomData.spy == DM.PlayerName ? DM.RoomData.gametopics.subtopic.content : DM.RoomData.gametopics.mtopic.content);
				}
			});
		}
	},

	PlayerChanged : function(snap){
		var name = snap.name();
		if(name == DM.RoomData.host){
			DM.FindNewHost();
		}
	},

	MakeHost : function(){
		var fb = new Firebase(this.RootRef + this.RoomTerm).child(DM.RoomID);
		fb.update({host:DM.PlayerName},function(success){
			if(!success) DM.FindNewHost();
			else {
				DM.RoomData.host = DM.PlayerName;
				DM.IsHost = true;
				if(DM.PlayerStatus == PlayerStatus.WaittingTopic){
					goCreateTopic();
				}
			}
		});
	},

	TopicFollowed : function(snap, prevName) {
		console.log(snap.name());
	},

	FindNewHost : function(){
		var fb = new Firebase(this.RootRef + this.RoomTerm).child(DM.RoomID).child(DM.PListTerm);
		fb.on('value',function(snap){
			var isNeedAHost = true;
			snap.forEach(function(child){
				if(isNeedAHost){
					var name = child.name();
					if(name == DM.PlayerName) DM.MakeHost();
					isNeedAHost = false;
				}
			});
		});
	},

	CreateTopic : function(){
		var topic = verifyInput('#txtTopic','Please write something to run the game.');
		if(!topic) return;
		var fb = new Firebase(DM.RootRef + DM.RoomTerm).child(DM.RoomID);
		fb.update({topic:{content:topic, creator:DM.PlayerName}}, function(success){
			if(success) goTopic();
			else {
				show_info('vInfo','Sorry, please try again','error');
			}
		});
	},

	SubmitTopic : function(){
		var topic = verifyInput('#txtTopic','Please type something related to the topic so we can move on.','error');
		if(!topic) return;
		var fb = new Firebase(DM.RootRef + DM.RoomTerm).child(DM.RoomID).child(DM.FoTopicTerm);
		fb.push({content:topic,creator:DM.PlayerName}, function(success){
			if(!success) show_info('vInfo','Sorry,please try again','error');
			else goTopic();
		});
	},

	Finish: function(){
		var fb = new Firebase(DM.RootRef + DM.RoomTerm).child(DM.RoomID);
		fb.child('finish').transaction(function(value){
			if(!value) value = 0;
			return value+1;
		},function(success,snap){
			if(!success) DM.Finish();
			else goChoise();
		});
	},

	ClearUp : function(){
		var fb = new Firebase(DM.RootRef + DM.RoomTerm).child(DM.RoomID);
		fb.update({
			FoTopics : null,
			gametopics : null,
			spy : null,
			topic : null,
			finish : 0
		},function(success){
			if(!success) DM.ClearUp();
			else {
				var status = DM.RoomData;
				status.FoTopics = null;
				status.gametopics = null;
				status.spy = null;
				status.topic = null;
				status.finish = 0;
			}
		});
	}
}