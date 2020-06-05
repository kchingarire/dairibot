const express = require('express');
const router = express.Router();

var request = require('request');
var url1 = 'https//localhost:3000';
var url2 = 'https://localhost:3000';

var appPhoneNumber = '263788108777@c.us';
var system='status@broadcast'; 

// Load chat model
const Messages = require('../models/message');
const Contacts= require('../models/contacts');
const Contents= require('../models/contents');
const Menu = require('../models/menu');
const Stages=require('../models/stages');
const PreviousStages=require('../models/previousstages');

const imageFile="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"

//route to add new menu line
router.post('/saveMenu/', function (req, res) {
    var data=req.body;
    var menu = new Menu({
        stage:data.stage,
        itemName:data.itemName,
        parent:data.parent,
        option:data.option,
        nextStage:data.nextStage,
    });
    // Save the new menu
    menu.save(function (error) {
        if(error){
            console.error("write error: " + error.message);
            res.send(err);
        }else{
            console.log("new menu saved " );
            res.send(data);
        };
    });
    
});

router.post('/saveContent/', function (req, res) {
    var data=req.body;
    var contents = new Contents({
        id:data.id,
        content:data.content,
        title:data.title,
        keywords:data.keywords,
        image:data.image
    });
    // Save the new menu
    contents.save(function (error) {
        if(error){
            console.error("write error: " + error.message);
            res.send(err);
        }else{
            console.log("new contents saved " );
            res.send(data);
        };
    });
    
});

// Handle POST request
router.post('/', function (req, res) {
    // console.log('in webhook');  
    var data = req.body; // New messages in the "body" variable
    //console.log(data);
    //for (var i = 0; i < data.messages.length; i++) { // For each message
    var time = new Date().getTime() / 1000;
    if (data){
        if (data.user!=appPhoneNumber && data.user!=system) {
            //log incoming message
            console.log('Incoming message Type:'+data.type+' From:'+ data.user+' text >>'+data.text);
            var m={
                type:data.type,
                author:data.user,
                body:data.text,
                fromMe:false,
                chatId:data.user,
                time:time
            }

            //save message to database
            Messages.create(m, function (err, data){
                if (err) console.log('Message not saved',err)
                }
            );
            
                //1. Check if first message

                const checkMyResponse = async function(txt){
                    if (typeof(txt)==='string'){
                        if (txt){
                            if (txt.indexOf('Still getting data on this') > 0) {
                                var msg = await getMenuText('A',data);
                                finalResponse(msg);         
                            }
                        }
                    }
                }
              

                const sendInitialMessage = async function(message){
                    var txt = await getMenuText('A',message);
                    res.send( [{
                        "text": txt,
                        "type": "message"
                    }])
                }


                const  analyseResponse = async function(message, func){
                    // get last stage
                    var first = await firstMessage(message);
                    if (first == true){
                        askForName(message);
                        return; 
                    }
                    var stage = await getLastStage(message);
                    console.log("STAGE: ",stage);
                    if (stage.stage == 'ASK'){
                       var txt = 'Hi! *' + message.text + '*\n';
                        saveContactName(message,message.text);
                        txt += 'I am very pleased to meet you.\n\n';
                        
                        var m = await getMenuText('A',message);
                        m.msg = txt + m.msg;
                        //sendMessage(message, m);
                    }
                    if ((isGreeting(message.text) == true)) {
                        var m = await getMenuText('A',message);
                        //sendMessage(message, m);
                    } else if (isBackButton(message) == true){
                        console.log('BACK');
                        var newStage = await getPreviousStage(message);
                        console.log('Prev Stage:', newStage);
                        if (typeof(newStage === 'object')){
                            var m = await getStageText(newStage, message);
                            //sendMessage(message,m);
                        } else {
                            var m = await getMenuText('A',message);
                            //sendMessage(message, m);
                        }
                        checkMyResponse(m);
                    } else if (isLoggingComplaint(stage) == true){
                        console.log("Logging complaint");
                         processComplaint(message,stage);
                    }
                    else {
                        var opt = await isMenuOption(stage,message);
                        console.log('opt',opt);
                        if (opt>0) { 
                            // implies that the option is available on the list of presented menu options
                            var newStage = await getNextMenu(stage,opt);
                            console.log('Next Stage:' +newStage);
                            var m = await getMenuText(newStage,message);
                            
                            //sendMessage(message,m);
                            checkMyResponse(m);
                        } else if (opt == 0) { // implies that the option is NOT available on the list of presented menu options
                            //check if it's a content option
                            var msg = '';
                            if ((stage.stage == 'content')||(stage.stage == 'menu')){
                            txt = await processContentOption(message);
                            var m = {"msg": txt,
                                        "stage": stage.stage,
                                        "stage_type": stage.stage_type,
                                        "stageDetails": []};
                            //sendMessage(message, m);
                            checkMyResponse(msg);
                            }
                            if (msg =='') {
                                //else, present first menu
                                var msg = await getMenuText('A',message);
                                return msg
                                //sendMessage(message, msg);
                            }

                        } else if (opt == -1) {
                            //implies that the response is not a number therefore
                            // 1. search for the response in the list of menu options
                            console.log("1. search for the response in the list of menu options");
                            var txt = await getMenuFromText(message);
                            var m = {"msg": txt,
                                        "stage": stage.stage,
                                        "stage_type": stage.stage_type,
                                        "stageDetails": []};
                            console.log(m);
                            //sendMessage(message,m);
                            checkMyResponse(m);
                            if (m.msg === '') {
                            // 2. search for the response in the content
                                console.log(" 2. search for the response in the content");
                                var m = await getContentFromText(stage,message);
                                if ( m.msg != '') {
                                    return m;
                                    //sendMessage(message, m);
                                    checkMyResponse(m);
                                } else {
                                    //invalid response therefore, present first menu
                                    console.log("invalid response therefore, present first menu");
                                    txt = await getMenuText('A',message);
                                    return msg;
                                    //sendMessage(message, msg);
                                }
                            }
                        }
                
                    }   
                    return m.msg;
                }

                
                const finalResponse = async function(message){
                    responseText= await analyseResponse(message);
                    console.log("RESPONSE::",responseText);
                    if(typeof responseText != 'undefined'){
                        if(typeof responseText.msg!='undefined'){
                            if(typeof responseText.img!='undefined'){
                                res.send( [{
                                    "text": responseText.msg,
                                    "type": "message",
                                    "file":imageFile
                                }])
                            }else{
                                res.send( [{
                                    "text": responseText.msg,
                                    "type": "message"
                                }])
			   }
                        }else {
                            res.send( [{
                                "text": responseText,
                                "type": "message"
                            }])
                        }
                    }else{
                        res.send( [{
                            "text": 'Sorry... there is no information yet on this',
                            "type": "message"
                        }])
                    }
                }
                finalResponse(data);

                const askForName = async function(message){
                    data =  await Menu.find({stage: 'ASK'});
                   //console.log('menu',data);
                   var txt = '';
                   if (data){
                       if (data.length>0){
                         data.forEach((item)=>{
                            txt += item.itemName + '\n';
                         })
                       }
                    }
                    finalResponse(txt);
                }

                const  processComplaint=async function(message, stage){
                    console.log("processing Complaint",message);
                    if (message.body){
                        saveComplaint(message);
                        //0. Check if the complaint is being concluded
                        if (isResponseNegative(message) == true){
                            //Send concluding msg
                            txt = 'Thank you. Your feedback is important to us';
                            m={"msg":txt,
                            "img":"",
                            "stage_type": 'menu',
                            "stage": 'A',
                            "stageDetails": []};
                            finalResponse(txt);
                            //1. forward msg to agent
                            await forwardComplaints(message);
                        } else {
                            txt = "Thank you. Your complaint has been forwaded to the rightful person who will get in touch with you promptly.\n Is there anything else that you want to add?";
                            m={"msg":txt,
                            "img":"",
                            "stage_type": stage.stage_type,
                            "stage": stage.stage,
                            "stageDetails": []};
                            finalResponse(txt);
                        }
                         
                    }   
                }
               
                
            }
      
    }
    //res.send('ok');
});




const getSalutation = async function(message){
    name = await getContactName(message);
    return 'Ok! *' + name + '*,\n I am here to assist you on any information you may need to know about *Dairibord*.\n\n';
}

function isBackButton(message){
    txt = message.text;
    //remove special characters
    txt = txt.replace(/[^\w\s]/gi, ' ');
    txt = txt.toUpperCase().trim();
    if ((txt == '#')||(txt == 'BACK')){
        return true;
    } else {
        return false;
    }
}

function isDirectMessage(message){
    if (message.user.indexOf('@c.us') > 0) {
        return true;
    } else {
        return false;
    }
}

function isChangingName(message){
    txt = message.text;
    //remove special characters
    txt = txt.replace(/[^\w\s]/gi, ' ');
    txt = txt.toUpperCase().trim();
    if ((txt == 'CHANGE')||(txt == 'CHANGE MY NAME')||(txt == 'CHANGE NAME')){
        return true;
    } else {
        return false;
    }
}

function isResponseNegative(message){
    txt = message.text;
    //remove special characters
    txt = txt.replace(/[^\w\s]/gi, ' ');
    txt = txt.toUpperCase().trim();
    if ((txt == 'NO')||(txt == 'NOPE')||(txt == 'NA')){
        return true;
    } else {
        return false;
    }
}

function isLoggingComplaint(stage){
    if (stage.stage_type === 'complaint'){
        return true;
    } else {
        return false;
    }
}


function isGreeting(txt){
    //remove special characters
    txt = txt.replace(/[^\w\s]/gi, ' ');
    txt = txt.toUpperCase().trim();
    if  ((txt === 'HI')||(txt === 'HELLO')||(txt==='HIE')||(txt=='YO')||(txt=='MENU')){
        return true;
    } else {
        return false;
    }
}

const isMenuOption = async function (stage, message){
    txt = message.text;
    //remove special characters
    txt = txt.replace(/[^\w\s]/gi, ' ');
    txt = txt.toUpperCase().trim();
    var opt = parseInt(txt);
    //console.log('stage',stage,'opt',opt);
    if (!isNaN(opt)){
        var option = await getOpt(stage,opt);
        return option;
    } else {
        return -1;
    }
}

const processContentOption = async function (message){
    txt = message.text;
    //remove special characters
    txt = txt.replace(/[^\w\s]/gi, ' ');
    txt = txt.toUpperCase().trim();
    var opt = parseInt(txt);
    console.log('processContentOption','opt',opt);
    if (!isNaN(opt)){
        var phoneNumber = getPhoneNumber(message);
        // var stages = new Stages;
        var contentId = null;
        st =  await Stages.findById(phoneNumber)
        if (st){
            if (st.details){
                st.details.forEach((item)=>{
                    if (opt == item.option){
                        contentId = item.contentId;
                    }
                })
            }
            console.log('contentId',contentId);
            if (contentId){
                if (st.stage == 'content') {
                   // saveStage(message,'A');
                    return await getContentById(contentId);
                } else if (st.stage == 'menu') {
                    return await getMenuById(contentId,message);
                }
            }
        }
        return '';
    } else {
        return '';
    }
}

const getOpt=async function(stage,opt){
    data = await Menu.findOne({'parent': stage, 'option': opt});
        if (data){
            return data.option;
         }
            return 0;
}

const getStageText = async function(stage, message){
    var msg = '';
    if (stage.details){
        stage.details.forEach((d)=>{
            msg += d.option + '. ' + d.title + '\n'
        })
        msg += '#. Back\n\n';
        msg += 'Please select your option from the list given above.'
        m={"msg":msg,"img":""};
        saveStage(message,stage.stage,stage.details);
        return m;
    } else if (typeof(stage) === 'string'){
        return await getMenuText('A',message);
    }
    
}

const  getNextMenu=async function(stage, option){
   var txt = '';
   data = await Menu.findOne({'parent': stage, 'option': option});
       if (data){
           //console.log('nextstage',data.stage);
           return data.stage;
        } else {
            return 0;
        }      
}

const  getMenuFromText=async function(message){
    var txt = message.text;
    data = await Menu.find({
        $text: { $search: txt , $language: 'english'}
      });
      if (data){
            if (data.length ==0){
                return '';
            } else if (data.length == 1) {
                return await getMenuText(data[0].stage,message);
            } else if (data.length>1){
                //Get array of titles
                var msg = '';
                var lastmsg = '';
                stageDetails = [];
                var n = 0;
                data.forEach((item)=>{
                    if (item.itemName) {
                        n++;
                        msg += n +'. ' + item.itemName + '\n';
                        stageDetails.push({option: n, contentId: item._id, title: item.itemName});
                        lastmsg = '*'+ item.itemName + '*\n' ;
                    }
                });
                if (n == 1){
                    return lastmsg;
                } else if (n > 1){
                    saveStage(message,'menu',stageDetails);
                    msg += '#. Back\n\n';
                    msg += 'Please select your option from the list given above.'
                    return msg;
                } 
            }
        } else {
            return '';
        }
 }



const  saveComplaint = async function(message){
    //check if person is in DB and store if not
    data =  await Contacts.findOne({'phoneNumber':getPhoneNumber(message)});
    
    if (data){
        newcomplaint = { messageId: message.id};
        if (data.complaints){
            data.complaints.push(newcomplaint);
        } else {
            data.complaints = [newcomplaint];
        }
        Contacts.updateOne({_id:data._id},
            {
                    complaints : data.complaints
            }, function (err,data){
                if (err) console.log('Contact not updated',err)
            });     
        return;
    } else { // insert new contact
        //console.log('Saving contact');
        contact = new Contacts({'phoneNumber':getPhoneNumber(message), 'name': name, 'senderName': message.senderName});
        contact.save();
        return;         
    }
}

const  forwardComplaints = async function(message){
    //check if person is in DB and store if not
    contact =  await Contacts.findOne({'phoneNumber':getPhoneNumber(message)});
    agents = await Agents.find();
     //formaat the message
     var name = await getContactName(message);
     var phone = getPhoneNumber(message);
     subject = '*Complaint via Dairibord Chatbot*';
     html = '<p><strong>Complaint From: </strong>' + name + '</p>';
     html += '<p><strong>Phone Number: </strong>' + phone + '</p>';
     html = '<p>' + message.body + '</p>';
     txt = '*Complaint From:* ' + name + '\n';
     txt += '*Phone Number:* ' + phone + '\n';
     //txt =  message.body + '\n'; 
    if ((contact)&&(agents)){
        if (contact.complaints){ 
            agents.forEach((agent)=>{
                sendQuickMessage(agent.phoneNumber,txt);
                contact.complaints.forEach((c)=>{
                    forwardMessage(agent.phoneNumber,c.messageId);
                });
            });
        }
    }
   
}


const  getPreviousStage=async function(message){
    var stage;
    data = await PreviousStages.find({'phoneNumber': getPhoneNumber(message)}, null, {sort: '-created', limit: 2});
        if (data){
            //console.log(data);
            var k = data.length;
            data.forEach((s)=>{
                //console.log('k=',k);
                if ((s.stage == 'A')||(k == 1)){
                  stage = s;
                }
                k--;
            });
         }
         if (stage){
             return stage;
        } else
         return 'A';
 }

function getPhoneNumber(message){
    // check the message if private or group
    // return a split phone number
    var phone = message.user;
    if (phone.indexOf('@c.us') > 0) {
        // number is private so strip it
        var new_phone = phone.replace('@c.us', '');
        return new_phone;
    } else {
        return 0;
    }
}

const firstMessage = async function(message){
    //check if person is in DB and store if not
    data =  await Contacts.findOne({'phoneNumber':getPhoneNumber(message)});
    
    if (data){
        console.log('Data',data);
        return false;
    } else {
        console.log('Saving New contact');
        contact = new Contacts({'phoneNumber':getPhoneNumber(message)});
        contact.save();
        return true;         
    }
};

const getContactName = async function(message){
    data =  await Contacts.findOne({'phoneNumber':getPhoneNumber(message)});
    var name = '';
    if (data){
        name = data.name;
    }

    if ((name == undefined)||(name == '')) {
        name = message.senderName;
    }
    return name;
   
}

const saveContactName = async function(message,name){
    //check if person is in DB and store if not
    data =  await Contacts.findOne({'phoneNumber':getPhoneNumber(message)});
    
    if (data){
        Contacts.updateOne({_id:data._id},
            {
                    name: name,
                    phoneNumber: getPhoneNumber(message),
                    senderName: message.senderName
            }, function (err,data){
                if (err) console.log('Contact not updated',err)
            });     
        return;
    } else { // insert new contact
        //console.log('Saving contact');
        contact = new Contacts({'phoneNumber':getPhoneNumber(message), 'name': name, 'senderName': message.senderName});
        contact.save();
        return;         
    }
};

function dbtest(){
    Menu.find({},function (err, docs) {
        console.log(docs);

        if(err){
            console.log(err);
        }
    
    });  
}



const  getMenuText= async function(stage, message){
   //var menu = new Menu;
   var txt = '';
   var m={"msg":"","img":""};
   if (stage == 'A'){
       txt += await getSalutation(message);
   }
   txt += 'To make it easy kindly reply with an option below:\n';
//    return 'Test msg';
   //console.log('stage',stage);
   data =  await Menu.find({parent: stage});
   //console.log('menu',data);
   if (data){
       if (data.length>0){
           var stageDetails = [];
           data.forEach((menuItem)=>{
               txt += '\n' + menuItem.option + '. ' + menuItem.itemName;
               stageDetails.push({option: menuItem.option, title: menuItem.itemName});
		        //console.log(txt);
           });
           if (stage != 'A'){
               // Add Back
               txt += '\n#. Back\n\n'; 
           } else {
               txt += "\n\nif your option is not above kindly type *Enquiry*"
           }
           if (stage){
                saveStage(message,stage, stageDetails);
            }
            m={"msg":txt,"img":""};
           return m;
           
        } else {
            console.log('No Menu found');
            var txt = await getContent(stage,message);
            m={"msg":txt,"img":""};
            return txt;
        }
    } else {

    }
};

const getContent = async function(stage, message){
    console.log('getContent',stage);
    data = await Contents.find({id: stage});
    var m={"msg":"","img":""};
    if (data){
        if (data.length ==0){
            return 'Still getting data on this.... Will update you shortly.';
          } else if (data.length == 1) {
               var msg = '';var img='';
               if (data[0].title){
                   msg = '*'+ data[0].title.trim() + '*\n'
               }
               if(data[0].image){
                   img=data[0].image;
               }
               msg += data[0].content;
               m={"msg":msg,"img":img};
               return m;
           } else if (data.length>1){
               //Get array of titles
               var msg = '';
               var lastmsg = '';
               stageDetails = [];
               var n = 0;
               data.forEach((item)=>{
                   if (item.title) {
                       n++;
                       msg += n +'. ' + item.title + '\n';
                       stageDetails.push({option: n, contentId: item._id, title: item.title});
                       lastmsg = '*'+ item.title.trim() + '*\n' + item.content;
                   }
               });
               if (n == 1){
                    m={"msg":lastmsg,"img":""};
                   return m;
               } else if (n > 1){
                   saveStage(message,'content',stageDetails);
                   msg += '#. Back\n\n';
                   msg += 'Please select your option from the list given above.'
                   m={"msg":msg,"img":""};
                   return m;
               } 
           }
    } else {
        return 'Still getting data on this topic.... Will update you shortly.';
    }
}

const getContentById = async function(contentId){
    data = await Contents.findById(contentId);
    if (data){
        var msg = '';
        if (data.title){
            msg = '*'+ data.title.trim() + '*\n'
        }
        msg += data.content;
        return msg;
    } else {
        return 'Still getting data on this topic.... Will update you shortly.';
    }
}

const getMenuById = async function(contentId, message){
    data = await Menu.findById(contentId);
    if (data){
        return await getMenuText(data.stage,message);
    } else {
        return 'Still getting data on this topic.... Will update you shortly.';
    }
}

const getContentFromText = async function(message){
    var txt = message.text
    data = await Contents.find({
        $text: { $search: txt , $language: 'english'}
      });
    if (data.length == 0){
        var msg = 'Could not find any information on what you have asked.\n';
        msg += 'Your enquiry has been forwarded to Customer Services.\n';
        msg = await getMenuText('A',message);
        var m={
            "msg":msg,
            "img":""
        }
        return m;
    } else if (data.length == 1){
        var msg = ''; var img='';
        if (data[0].title){
            msg = '*'+ data[0].title.trim() + '*\n'
        }
        if(data[0].image){
            img=data[0].image;
        }
        msg += data[0].content;
        var m={
            "msg":msg,
            "img":img
        }
        return m;
    } else if (data.length > 1){
        //Get array of titles
        var msg = '';
        var lastmsg = '';
        var m={
            "msg":msg,
            "img":img
        }
        stageDetails = [];
        var n = 0;
        data.forEach((item)=>{
            if (item.title) {
                n++;
                msg += n +'. ' + item.title + '\n';
                stageDetails.push({option: n, contentId: item._id, title: item.title});
                lastmsg = '*'+ item.title.trim() + '*\n' + item.content;
            }
        });
        if (n == 1){
            m={"msg":lastmsg,"img":""};
            return m;
        } else if (n > 1){
            saveStage(message,'content',stageDetails);
            msg += '#. Back\n\n';
            msg += 'Please select your option from the list given above.'
            m={"msg":msg,"img":""};
            return m;
        }
    }
}




const  getLastStage=async function(message){
    var phoneNumber = getPhoneNumber(message);
   // var stages = new Stages;
   st =  await Stages.findById(phoneNumber)
        if (st){
            return st.stage;
        }else {
            return 'A';
        }
}

function saveStage(message, stage, stageDetails){
    var id = getPhoneNumber(message);
    if (stageDetails){
        details = stageDetails;
    } else {
        details = [];
    }
    Stages.findById(id).then((data)=>{
        if (data){
            Stages.updateOne({_id:id},
                {
                        stage: stage,
                        phoneNumber: getPhoneNumber(message),
                        name: message.senderName,
                        details: details
                }, function (err,data){
                    if (err) console.log('Stage not updated',err)
                });        
        } else {// insert
            Stages.create(
                {
                    _id : getPhoneNumber(message),
                    stage: stage,
                    phoneNumber: getPhoneNumber(message),
                    name: message.senderName,
                    details: details
                }, function (err, data){
                    if (err) console.log('Stage not saved',err)
                }
            );
        }
    });
    PreviousStages.create({
        stage: stage,
        phoneNumber: getPhoneNumber(message),
        name: message.senderName,
        msg: message.text,
        details: details
    }, function (err, data){
        if (err) console.log('PreviousStage not saved',err)
    })
}




 module.exports = router;
