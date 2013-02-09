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
	show_info('vInfo','Loading...','info');
	roomID = roomID.toLowerCase();
	name = name.toLowerCase();
	DM.Login(roomID,psw,name);
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
	$('#wrapper').load('login.html', null, function(){
		$('#txtRoomID').val(DM.RoomID == 'default' ? '' : DM.RoomID);
		$('#txtName').val(DM.PlayerName);
	});
}

function goFollowTopic(){
	$('#wrapper').load('followtopic.html', null, function(){
		//$(".collapse").collapse('show');
		$('#lbCount').html(DM.TopicCount + '/' + DM.PlayerCount);
		if(DM.RoomData && DM.RoomData.leadTopic){
			$('#lbTopic').html(DM.RoomData.leadTopic.content);
		}
		try{
			var topics = DM.RoomData.data.topics;
			for(var key in topics){
				if(topics[key].creator == DM.PlayerName) {
					DM.AfterSubmit();
					return;
				}
			}
		} catch(e){};
	});
}

function goTopic(){
	$('#wrapper').load('topic.html', null, function(){
		DM.TopicCount = 0;
		if(DM.RoomData.data.spy == DM.PlayerName){
			$('#lbTopic').html(DM.RoomData.data.spyTopic.content);
			//$('#lbRole').html('卧底');
		} else {
			$('#lbTopic').html(DM.RoomData.data.topic.content);
			//$('#lbRole').html('好人');
		}
		if(DM.IsHost){
			$('.host-only').removeClass('invisible');
		}
	});
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

var GameStatus = {
	Preparing : 0,
	OnGame : 1,
	Pending : 2
};

var DM = {
	Debug : false,

	FBRoot : function(){
		return new Firebase('https://who.firebaseIO.com/Tool/');
	},

	FBRoom : function(){
		return new Firebase('https://who.firebaseIO.com/Tool/Rooms/' + DM.RoomID +'/');
	},

	FBPlayers : function() {
		return DM.FBRoom().child('players');
	},

	FBGameData : function() {
		return DM.FBRoom().child('data');
	},

	FBTopics : function() {
		return DM.FBGameData().child('topics');
	},

	IsHost : false,
	PlayerName : '',
	RoomID : '',
	RoomPsw : '@',
	RoomData : {
		players : { playerName : false},
		psw : '@',
		status : GameStatus.Preparing,
		host : null,
		data : {
			leadTopic : 'ltopic',
			topic : 'topic',
			spyTopic : 'stopic',
			spy : 'player',
			topics : {
				topic : 1
			}
		}
	},

	PlayerCount : 0,
	TopicCount : 0,

	Login : function(roomID,psw,name){
		DM.PlayerName = name;
		DM.RoomID = roomID;
		DM.RoomPsw = psw;

		var fb = DM.FBRoom();
		fb.transaction(function(room){
			if(!room){
				room = {
					psw : psw,
					status : GameStatus.Preparing,
					host : name
				};
				room.players = new Object();
				room.players[name] = 0;
			}
			return room;
		}, function(error,committed,snap){
			if(error){
				return;
			}
			var room = snap.val();
			if(room.psw != psw){
				show_info('vInfo', roomID === 'default' ? "默认房间已经被使用了，请新建一个房间或输入正确的密码。" : "密码不正确。",'error');
				goLogin();
				return;
			}
			else if(room.players && room.players[name] > 0) {
				if(!confirm("房间内已经有同名玩家，确定要使用该名字登录?"))
				{
					goLogin();
					return;
				}
			}

			DM.RoomData = room;

			DM.DoneLogin();
			if(room.host == DM.PlayerName){
				DM.MakeHost();
				show_info('vInfo',"你创建了新房间 "+roomID,'success',true);
			}
			else {
				show_info('vInfo',"你进入了房间 "+roomID,'success',true);
			}
		});
	},

	DoneLogin : function(){
		var fb = DM.FBPlayers();
		fb.child(DM.PlayerName).transaction(function(value){return (!value ? 1 : value+1);});
		fb.child(DM.PlayerName).removeOnDisconnect();
		fb.on('value', DM.PlayerChanged);

		fb = DM.FBRoom().child('status');
		fb.on('value',function(snap){
			DM.RoomData.status = snap.val();
			switch(DM.RoomData.status){
				case GameStatus.Preparing:
					{
						var fb = DM.FBGameData();
						fb.once('value',function(snap){
							DM.RoomData['data'] = snap.val();
							goFollowTopic();
						});
						break;
					}
				case GameStatus.OnGame :
					{
						var fb = DM.FBGameData();
						fb.once('value',function(snap){
							DM.RoomData['data'] = snap.val();
							goTopic();
						});
						break;
					}
				default : return;
			}
		});

		fb = DM.FBTopics().on('value',function(snap){
			DM.TopicCount = snap.numChildren();
			$('#lbCount').html(DM.TopicCount + '/' + DM.PlayerCount);
			if(DM.IsHost && DM.TopicCount >= DM.PlayerCount && DM.TopicCount>=3) DM.GetReady();
		});
	},

	GetReady : function(){
		if(DM.PlayerCount < 3 && DM.TopicCount < 3) {
			show_info('vInfo','游戏需要三个人以上才可以进行。','info');
			return;
		}
		if(DM.PlayerCount > DM.TopicCount){
			if(!confirm('还有人没有提交词语，确定要马上开始游戏么？')) return;
		}
		var fb = DM.FBTopics();
		DM.SetGameStatus(GameStatus.Pending, function(){
			fb.once('value',DM.GenTopic);
		});
	},

	SetGameStatus : function(status, callback){
		var fb = DM.FBRoom();
		fb.update({status:status}, function(error){
			if(error) DM.SetGameStatus(status,callback);
			else callback();
		});
	},

	GenTopic : function(snap){
		var topic = null;
		var spyTopic = null;
		var topicStatis = new Object();
		var spy = null;
		snap.forEach(function(data){
			var child = data.val();
			if(!topicStatis[child.content]) topicStatis[child.content] = 1;
			else topicStatis[child.content]++;

			if(!topic) topic = child;
			else if(topic.content !== child.content) {
				if(!spyTopic) spyTopic=child;
				else if(topicStatis[child.content] <= topicStatis[child.content]){
					spyTopic = topic;
					topic = child;
				}
			}
		});
		if(!spyTopic){
			show_info('vInfo','难得一见，大家的词语都是一样的...请大家重新输入一次。',null);
			DM.SetGameStatus(GameStatus.Preparing,function(){
				goFollowTopic();
			});
			return;
		} else {
			var skip = spyTopic.creator;
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
		var fb = DM.FBRoom();
		var data = new Object();
		data['topics'] = snap.val();
		data['topic'] = topic;
		data['spyTopic'] = spyTopic;
		data['spy'] = spy;
		fb.update(
			{
				data:data,
				status:GameStatus.OnGame
			}, function(error){
			if(error) show_info('vInfo','上传数据失败，请重试','error');
			else {
				show_info('vInfo','开始游戏','success',true);
				DM.RoomData.data = data;
				DM.RoomData.status = GameStatus.OnGame;
				goTopic();
			}
		});
	},

	PlayerChanged : function(snap){
		var count = snap.numChildren();
		DM.RoomData.players = snap.val();
		if(count < DM.PlayerCount && count==1) {
			DM.ExitRoom();
		}
		else if(!snap.child(DM.RoomData.host).val()){
			DM.FindNewHost();
		}
		DM.PlayerCount = count;
		$('#lbCount').html(DM.TopicCount + '/' + DM.PlayerCount);
	},

	ExitRoom : function(){
		var fb = DM.FBRoom();
		fb.set(null,function(error){
			if(error) DM.ExitRoom();
			else {
				show_info('vInfo','由于人数不足，房间已经被关闭，请重新进入。','info',true);
				goLogin();
			}
		});
	},

	FindNewHost : function(){
		for(var player in DM.RoomData.players)
		{
			DM.RoomData.host = player;
			if(player == DM.PlayerName) DM.MakeHost();
			return;
		}
	},

	MakeHost : function(){
		var fb = DM.FBRoom();
		fb.update({host:DM.PlayerName},function(error){
			if(error) DM.FindNewHost();
			else {
				DM.RoomData.host = DM.PlayerName;
				DM.IsHost = true;
				if(DM.RoomData.status != GameStatus.OnGame) goFollowTopic();
				else goTopic();
			}
		});
	},

	SubmitTopic : function(){
		var topic = verifyInput('#txtTopic','Please type something related to the topic so we can move on.','error');
		if(!topic) return;
		var fb = DM.FBTopics();
		fb.push({content:topic,creator:DM.PlayerName}, function(error){
			if(error) show_info('vInfo','Sorry,please try again','error');
			else {
				show_info('vInfo','提交成功，请稍等','success',true);
				DM.AfterSubmit();
			}
		});
	},

	AfterSubmit : function(){
		$('.after-submit').removeClass('invisible');
		$('.before-submit').addClass('invisible');
		if(DM.IsHost){
			$('.host-only').removeClass('invisible');
		}
	},

	ClearUp : function(){
		if(!confirm('确定要开始新游戏么？所有人都将跳转回输入词语界面。')) return;
		var fb = DM.FBRoom();
		fb.update({
			data : null,
			status : GameStatus.Preparing
		},function(error){
			if(error) DM.ClearUp();
			else {
				DM.RoomData.data = null;
				DM.RoomData.status = GameStatus.Preparing;
			}
		});
	}
}