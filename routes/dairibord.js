const express = require('express');
const router = express.Router();

var request = require('request');
var url1 = 'https://eu137.chat-api.com/instance208379/sendFile?token=fc4uvxhqwxb5ofke';
var url2 = 'https://eu137.chat-api.com/instance208379/sendFile?token=fc4uvxhqwxb5ofke';

var appPhoneNumber = '263788108777@c.us';
var system = 'status@broadcast';

// Load chat model
const Messages = require('../models/message');
const Contacts = require('../models/contacts');
const Contents = require('../models/contents');
const Menu = require('../models/menu');
const Stages = require('../models/stages');
const Images = require('../models/images');
const PreviousStages = require('../models/previousstages');
const Agents = require('../models/agents');

var images = require('../images');

//route to add new menu line
router.post('/saveMenu/', function (req, res) {
    var data = req.body;
    var menu = new Menu({
        stage: data.stage,
        itemName: data.itemName,
        parent: data.parent,
        option: data.option,
        nextStage: data.nextStage,
    });
    // Save the new menu
    menu.save(function (error) {
        if (error) {
            console.error("write error: " + error.message);
            res.send(err);
        } else {
            console.log("new menu saved ");
            res.send(data);
        };
    });

});

router.post('/saveContent/', function (req, res) {
    var data = req.body;
    var contents = new Contents({
        id: data.id,
        content: data.content,
        title: data.title,
        keywords: data.keywords,
        image: data.image
    });
    // Save the new menu
    contents.save(function (error) {
        if (error) {
            console.error("write error: " + error.message);
            res.send(err);
        } else {
            console.log("new contents saved ");
            res.send(data);
        };
    });

});

// Handle POST request
router.post('/', function (req, res) {

    const sendInitialMessage = async function (message) {
        var m = await getMenuText('A', message);
        sendMessage(message, m);
    }

    const askForName = async function (message) {
        data = await Menu.find({ stage: 'ASK' });
        //console.log('menu',data);
        var txt = '';
        if (data) {
            if (data.length > 0) {
                data.forEach((item) => {
                    txt += item.itemName + '\n';
                })
            }
        }
        m = {
            "msg": txt,
            "img": "",
            "stage_type": 'ASK',
            "stage": 'ASK',
            "stageDetails": []
        };
        sendMessage(message, m);
    }

    const getSalutation = async function (message) {
        name = await getContactName(message);
        return 'Ok! *' + name + '*,\n I am here to assist you on any information you may need to know about *Dairibord*.\n\n';
    }

    function isBackButton(message) {
        txt = message.body;
        //remove special characters
        txt = txt.replace(/[^\w\s]/gi, ' ');
        txt = txt.toUpperCase().trim();
        if ((txt == '#') || (txt == 'BACK')) {
            return true;
        } else {
            return false;
        }
    }

    function isDirectMessage(message) {
        if (message.chatId.indexOf('@c.us') > 0) {
            return true;
        } else {
            return false;
        }
    }

    function isChangingName(message) {
        txt = message.body;
        //remove special characters
        txt = txt.replace(/[^\w\s]/gi, ' ');
        txt = txt.toUpperCase().trim();
        if ((txt == 'CHANGE') || (txt == 'CHANGE MY NAME') || (txt == 'CHANGE NAME')) {
            return true;
        } else {
            return false;
        }
    }

    function isResponseNegative(message) {
        txt = message.body;
        //remove special characters
        txt = txt.replace(/[^\w\s]/gi, ' ');
        txt = txt.toUpperCase().trim();
        if ((txt == 'NO') || (txt == 'NOPE') || (txt == 'NA')) {
            return true;
        } else {
            return false;
        }
    }

    function isLoggingComplaint(stage) {
        if (stage.stage_type === 'complaint') {
            return true;
        } else {
            return false;
        }
    }

    function isOrdering(stage) {
        if (stage.stage_type === 'ordering') {
            return true;
        } else {
            return false;
        }
    }

    const analyseResponse = async function (message, func) {
        // get last stage
        var first = await firstMessage(message);
        if ((first == true) || (isChangingName(message))) {
            askForName(message);
            return;
        }
        var stage = await getLastStage(message);
        // console.log("STAGE: ",stage);
        if (stage.stage == 'ASK') {
            var txt = 'Hi! *' + message.body + '*\n';
            saveContactName(message, message.body);
            txt += 'I am very pleased to meet you.\n\n';

            var m = await getMenuText('A', message);
            m.msg = txt + m.msg;
            sendMessage(message, m);
            return;
        }
        if ((isGreeting(message.body) == true)) {
            var m = await getMenuText('A', message);
            sendMessage(message, m);
            return;
        } else if (isBackButton(message) == true) {
            console.log('BACK');
            var newStage = await getPreviousStage(message);
            console.log('Prev Stage:', newStage);
            if (typeof (newStage === 'object')) {
                var m = await getStageText(newStage, message);
                sendMessage(message, m);
                return;
            } else {
                var m = await getMenuText('A', message);
                sendMessage(message, m);
                return;
            }
            // checkMyResponse(m);
        } else if (isLoggingComplaint(stage) == true) {
            console.log("Logging complaint");
            processComplaint(message, stage);
        } else if (isOrdering(stage) == true) {
            console.log("Processing Orders");
            processOrders(message, stage);
        }
        else {
            var opt = await isMenuOption(stage, message);
            console.log('opt', opt);
            if (opt > 0) {
                // implies that the option is available on the list of presented menu options
                var newStage = await getNextMenu(stage, opt);
                console.log('Next Stage:' + newStage);
                var m = await getMenuText(newStage, message);
                sendMessage(message, m);
                // checkMyResponse(m);
            } else if (opt == 0) { // implies that the option is NOT available on the list of presented menu options
                //check if it's a content option
                var msg = '';
                if ((stage.stage == 'content') || (stage.stage == 'menu')) {
                    txt = await processContentOption(message);
                    var m = {
                        "msg": txt,
                        "stage": stage.stage,
                        "stage_type": stage.stage_type,
                        "stageDetails": []
                    };
                    sendMessage(message, m);
                    //    checkMyResponse(msg);
                }
                if (msg == '') {
                    //else, present first menu
                    var msg = await getMenuText('A', message);
                    sendMessage(message, msg);
                }
            } else if (opt == -1) {
                //implies that the response is not a number therefore
                // 1. search for the response in the list of menu options
                console.log("1. search for the response in the list of menu options");
                var txt = await getMenuFromText(message);
                var m = {
                    "msg": txt,
                    "stage": stage.stage,
                    "stage_type": stage.stage_type,
                    "stageDetails": []
                };
                console.log(m);
                sendMessage(message, m);
                // checkMyResponse(m);
                if (m.msg === '') {
                    // 2. search for the response in the content
                    console.log(" 2. search for the response in the content");
                    var m = await getContentFromText(stage, message);
                    if (m.msg != '') {
                        sendMessage(message, m);
                        // checkMyResponse(m);
                    } else {
                        //invalid response therefore, present first menu
                        console.log("invalid response therefore, present first menu");
                        var msg = await getMenuText('A', message);
                        sendMessage(message, msg);
                    }
                }
            }
        }
    }

    // const checkMyResponse = async function(msg){
    //     var txt = msg.msg;
    //     if (typeof(txt)==='string'){
    //         if (txt){
    //             if (txt.indexOf('Still getting data on this') > 0) {
    //                 var msg = await getMenuText('A',message);
    //                 sendMessage(message, msg);         
    //             }
    //         }
    //     }
    // }

    function isGreeting(txt) {
        //remove special characters
        txt = txt.replace(/[^\w\s]/gi, ' ');
        txt = txt.toUpperCase().trim();
        if ((txt === 'HI') || (txt === 'HIE') || (txt == 'YO') || (txt == 'MENU')) {
            return true;
        } else {
            return false;
        }
    }

    const isMenuOption = async function (stage, message) {
        txt = message.body;
        //remove special characters
        txt = txt.replace(/[^\w\s]/gi, ' ');
        txt = txt.toUpperCase().trim();
        var opt = parseInt(txt);
        // console.log('isMenuOption: stage',stage,'opt',opt);
        if (!isNaN(opt)) {
            var option = await getOpt(stage, opt);
            console.log("Ndaiwana");
            return option;
        } else {
            return -1;
        }
    }

    const processContentOption = async function (message) {
        txt = message.body;
        //remove special characters
        txt = txt.replace(/[^\w\s]/gi, ' ');
        txt = txt.toUpperCase().trim();
        var opt = parseInt(txt);
        console.log('processContentOption', 'opt', opt);
        if (!isNaN(opt)) {
            var phoneNumber = getPhoneNumber(message);
            // var stages = new Stages;
            var contentId = null;
            st = await Stages.findById(phoneNumber)
            if (st) {
                if (st.details) {
                    st.details.forEach((item) => {
                        if (opt == item.option) {
                            contentId = item.contentId;
                        }
                    })
                }
                console.log('contentId', contentId);
                if (contentId) {
                    if (st.stage == 'content') {
                        // saveStage(message,'menu','A');
                        return await getContentById(contentId);
                    } else if (st.stage == 'menu') {
                        return await getMenuById(contentId, message);
                    }
                }
            }

            return '';
        } else {
            return '';
        }
    }

    const getOpt = async function (stage, opt) {
        data = await Menu.findOne({ 'parent': stage.stage, 'option': opt });
        if (data) {
            return data.option;
        }
        return 0;
    }

    const getStageText = async function (stage, message) {
        console.log("getStageText");
        var msg = '';
        if (stage.details && (stage.details.length > 0)) {
            stage.details.forEach((d) => {
                msg += d.option + '. ' + d.title + '\n'
            })
            msg += '#. Back\n\n';
            msg += 'Please select your option from the list given above.'
            m = {
                "msg": msg,
                "img": "",
                "stage_type": stage.stage_type,
                "stage": stage.stage,
                "stageDetails": stage.details
            };
            return m;
        } else if (isLoggingComplaint(stage)) {
            return await processComplaint(message, stage);
        } else if (isOrdering(stage)) {
            return await processOrders(message, stage);
        } else {
            return await getMenuText('A', message);
        }
    }

    const processComplaint = async function (message, stage) {
        // console.log("processing Complaint",message);
        if (message.body) {
            saveComplaint(message);
            //0. Check if the complaint is being concluded
            if (isResponseNegative(message) == true) {
                //Send concluding msg
                txt = 'Thank you. Your feedback is important to us';
                m = {
                    "msg": txt,
                    "img": "",
                    "stage_type": 'menu',
                    "stage": 'A',
                    "stageDetails": []
                };
                // sendMessage(message,m);
                //1. forward msg to agent
                await forwardComplaints(message, m);
            } else {
                txt = "Thank you. Your complaint has been forwaded to the rightful person who will get in touch with you promptly.\n Is there anything else that you want to add?";
                m = {
                    "msg": txt,
                    "img": "",
                    "stage_type": stage.stage_type,
                    "stage": stage.stage,
                    "stageDetails": []
                };
                sendMessage(message, m);
            }

        }
    }

    const processOrders = async function (message, stage) {
        // console.log("processing Complaint",message);
        if (message.body) {
            saveOrder(message);
            //0. Check if the complaint is being concluded
            if (isResponseNegative(message) == true) {
                //Send concluding msg
                txt = 'Thank you for shopping with us';
                m = {
                    "msg": txt,
                    "img": "",
                    "stage_type": 'menu',
                    "stage": 'A',
                    "stageDetails": []
                };
                // sendMessage(message,m);
                //1. forward msg to agent
                await forwardOrders(message, m);
            } else {
                txt = "Thank you. Your order has been forwaded to the rightful person who will get in touch with you promptly.\n Is there anything else that you want to add?";
                m = {
                    "msg": txt,
                    "img": "",
                    "stage_type": stage.stage_type,
                    "stage": stage.stage,
                    "stageDetails": []
                };
                sendMessage(message, m);
            }

        }
    }

    const saveComplaint = async function (message) {
        //check if person is in DB and store if not
        data = await Contacts.findOne({ 'phoneNumber': getPhoneNumber(message) });

        if (data) {
            newcomplaint = {
                messageId: message.id,
                text: message.body
            };
            if (data.complaints) {
                data.complaints.push(newcomplaint);
            } else {
                data.complaints = [newcomplaint];
            }
            Contacts.updateOne({ _id: data._id },
                {
                    complaints: data.complaints
                }, function (err, data) {
                    if (err) console.log('Contact not updated', err)
                });
            return;
        } else { // insert new contact
            //console.log('Saving contact');
            contact = new Contacts({ 'phoneNumber': getPhoneNumber(message), 'name': name, 'senderName': message.senderName });
            contact.save();
            return;
        }
    }

    const forwardComplaints = async function (message, m) {
        //check if person is in DB and store if not
        var newMessageList = [m];
        contact = await Contacts.findOne({ 'phoneNumber': getPhoneNumber(message) });
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
        mesgs = []
        if ((contact) && (agents)) {
            if (contact.complaints) {
                agents.forEach((agent) => {
                    if (agent.chatId) {
                        console.log(agent);
                        mesgs.push({
                            "chatId": agent.chatId,
                            "text": txt
                        });
                        contact.complaints.forEach((c) => {
                            if (!c.forwarded) {
                                mesgs.push({
                                    "chatId": agent.chatId,
                                    "text": c.text,
                                    "forwarded": true,
                                    "messageId": c.messageId
                                });
                            }
                        });
                    }
                });
                markComplaintsAsForwarded(contact.phoneNumber);
            }
        }
        console.log(mesgs);
        if (mesgs.length > 0) newMessageList = newMessageList.concat(mesgs);
        sendMessage(message, newMessageList);
    }

    const saveOrder = async function (message) {
        //check if person is in DB and store if not
        data = await Contacts.findOne({ 'phoneNumber': getPhoneNumber(message) });

        if (data) {
            neworder = {
                messageId: message.id,
                text: message.body
            };
            if (data.orders) {
                data.orders.push(neworder);
            } else {
                data.orders = [neworder];
            }
            Contacts.updateOne({ _id: data._id },
                {
                    orders: data.orders
                }, function (err, data) {
                    if (err) console.log('Contact not updated', err)
                });
            return;
        } else { // insert new contact
            //console.log('Saving contact');
            contact = new Contacts({ 'phoneNumber': getPhoneNumber(message), 'name': name, 'senderName': message.senderName });
            contact.save();
            return;
        }
    }

    const forwardOrders = async function (message, m) {
        //check if person is in DB and store if not
        var newMessageList = [m];
        contact = await Contacts.findOne({ 'phoneNumber': getPhoneNumber(message) });
        agents = await Agents.find();
        //formaat the message
        var name = await getContactName(message);
        var phone = getPhoneNumber(message);
        subject = '*Order via Dairibord Chatbot*';
        html = '<p><strong>Order From: </strong>' + name + '</p>';
        html += '<p><strong>Phone Number: </strong>' + phone + '</p>';
        html = '<p>' + message.body + '</p>';
        txt = '*Order From:* ' + name + '\n';
        txt += '*Phone Number:* ' + phone + '\n';
        //txt =  message.body + '\n';
        mesgs = []
        if ((contact) && (agents)) {
            if (contact.orders) {
                agents.forEach((agent) => {
                    if (agent.chatId) {
                        console.log(agent);
                        mesgs.push({
                            "chatId": agent.chatId,
                            "text": txt
                        });
                        contact.orders.forEach((c) => {
                            if (!c.forwarded) {
                                mesgs.push({
                                    "chatId": agent.chatId,
                                    "text": c.text,
                                    "forwarded": true,
                                    "messageId": c.messageId
                                });
                            }
                        });
                    }
                });
                markOrdersAsForwarded(contact.phoneNumber);
            }
        }
        console.log(mesgs);
        if (mesgs.length > 0) newMessageList = newMessageList.concat(mesgs);
        sendMessage(message, newMessageList);
    }




    const getNextMenu = async function (stage, option) {
        var txt = '';
        data = await Menu.findOne({ 'parent': stage.stage, 'option': option });
        if (data) {
            console.log('nextstage', data.stage);
            return data.stage;
        } else {
            return 0;
        }
    }

    const getMenuFromText = async function (message) {
        var txt = message.body;
        data = await Menu.find({
            $text: { $search: txt, $language: 'english' }
        });
        if (data) {
            if (data.length == 0) {
                return '';
            } else if (data.length == 1) {
                return await getMenuText(data[0].stage, message);
            } else if (data.length > 1) {
                //Get array of titles
                var msg = '';
                var lastmsg = '';
                stageDetails = [];
                var n = 0;
                data.forEach((item) => {
                    if (item.itemName) {
                        n++;
                        msg += n + '. ' + item.itemName + '\n';
                        stageDetails.push({ option: n, contentId: item._id, title: item.itemName });
                        lastmsg = '*' + item.itemName + '*\n';
                    }
                });
                if (n == 1) {
                    return lastmsg;
                } else if (n > 1) {
                    saveStage(message, 'menu', 'menu', stageDetails);
                    msg += '#. Back\n\n';
                    msg += 'Please select your option from the list given above.'
                    return msg;
                }
            }
        } else {
            return '';
        }
    }

    const getPreviousStage = async function (message) {
        var stage;
        data = await PreviousStages.find({ 'phoneNumber': getPhoneNumber(message) }, null, { sort: '-created', limit: 2 });
        if (data) {
            //console.log(data);
            var k = data.length;
            data.forEach((s) => {
                //console.log('k=',k);
                if ((s.stage == 'A') || (k == 1)) {
                    stage = s;
                }
                k--;
            });
        }
        if (stage) {
            return stage;
        } else
            return {
                "stage": 'A',
                "stage_type": "menu"
            };
    }

    function getPhoneNumber(message) {
        // check the message if private or group
        // return a split phone number
        var phone = message.chatId;
        if (phone.indexOf('@c.us') > 0) {
            // number is private so strip it
            var new_phone = phone.replace('@c.us', '');
            return new_phone;
        } else {
            return 0;
        }
    }

    const firstMessage = async function (message) {
        //check if person is in DB and store if not
        data = await Contacts.findOne({ 'phoneNumber': getPhoneNumber(message) });

        if (data) {
            //console.log('Data',data);
            return false;
        } else {
            //console.log('Saving New contact');
            contact = new Contacts({ 'phoneNumber': getPhoneNumber(message) });
            contact.save();
            return true;
        }
    };

    const getContactName = async function (message) {
        data = await Contacts.findOne({ 'phoneNumber': getPhoneNumber(message) });
        var name = '';
        if (data) {
            name = data.name;
        }

        if ((name == undefined) || (name == '')) {
            name = message.senderName;
        }
        return name;

    }

    const saveContactName = async function (message, name) {
        //check if person is in DB and store if not
        data = await Contacts.findOne({ 'phoneNumber': getPhoneNumber(message) });

        if (data) {
            Contacts.updateOne({ _id: data._id },
                {
                    name: name,
                    phoneNumber: getPhoneNumber(message),
                    senderName: message.senderName
                }, function (err, data) {
                    if (err) console.log('Contact not updated', err)
                });
            return;
        } else { // insert new contact
            //console.log('Saving contact');
            contact = new Contacts({ 'phoneNumber': getPhoneNumber(message), 'name': name, 'senderName': message.senderName });
            contact.save();
            return;
        }
    };

    const markComplaintsAsForwarded = async function (phoneNumber) {
        //check if person is in DB and store if not
        data = await Contacts.findOne({ 'phoneNumber': phoneNumber });

        if (data) {
            newComplaints = [];
            data.complaints.forEach((c) => {
                c.forwarded = true;
                newComplaints.push(c);
            });
            Contacts.updateOne({ _id: data._id },
                {
                    complaints: newComplaints,
                }, function (err, data) {
                    if (err) console.log('Contact not updated', err)
                });
            return;
        }
    };

    const markOrdersAsForwarded = async function (phoneNumber) {
        //check if person is in DB and store if not
        data = await Contacts.findOne({ 'phoneNumber': phoneNumber });

        if (data) {
            newOrders = [];
            data.orders.forEach((c) => {
                c.forwarded = true;
                newOrders.push(c);
            });
            Contacts.updateOne({ _id: data._id },
                {
                    orders: newOrders,
                }, function (err, data) {
                    if (err) console.log('Contact not updated', err)
                });
            return;
        }
    };



    function dbtest() {
        Menu.find({}, function (err, docs) {
            console.log(docs);

            if (err) {
                console.log(err);
            }

        });
    }



    const getMenuText = async function (stage, message) {
        //var menu = new Menu;
        var txt = '';
        var m = { "msg": "", "img": "" };
        var stage_type = 'menu';
        var stageDetails = [];
        if (stage == 'A') {
            txt += await getSalutation(message);
        }
        txt += 'To make it easy kindly reply with an option below:\n';
        //    return 'Test msg';
        //console.log('stage',stage);
        data = await Menu.find({ parent: stage });
        //console.log('menu',data);
        if (data) {
            if (data.length > 0) {
                data.sort((a, b) => (a.option > b.option) ? 1 : -1);
                data.forEach((menuItem) => {
                    txt += '\n' + menuItem.option + '. ' + menuItem.itemName;
                    stageDetails.push({ option: menuItem.option, title: menuItem.itemName });
                    //    console.log("menuItem",menuItem);
                    if (menuItem.stage_type) {
                        stage_type = menuItem.stage_type;
                    }
                    //console.log(txt);
                });
                if (stage != 'A') {
                    // Add Back
                    txt += '\n#. Back\n\n';
                } else {
                    txt += "\n\nif your option is not above kindly type *Enquiry*"
                }
                //    if (stage){
                //         saveStage(message,stage_type,stage, stageDetails);
                //     }
                m = {
                    "msg": txt,
                    "img": "",
                    "stage_type": stage_type,
                    "stage": stage,
                    "stageDetails": stageDetails
                };
                return m;

            } else {
                console.log('No Menu found');
                var m = await getContent(stage, message);
                return m;
            }
        } else {

        }
    };

    const getContent = async function (stage, message) {
        console.log('getContent', stage);
        data = await Contents.find({ id: stage });
        var stage_type = "content"
        var m = {
            "msg": '',
            "img": '',
            "stage_type": stage_type,
            "stage": stage,
            "stageDetails": []
        };
        if (data) {
            if (data.length == 0) {
                return 'Still getting data on this.... Will update you shortly.';
            } else if (data.length == 1) {
                var msg = ''; var img = '';
                console.log("data[0]: is here", data[0]);
                if (data[0].title) {
                    msg = '*' + data[0].title.trim() + '*\n'
                }
                if (data[0].image) {
                    img = data[0].image;
                }
                //console.log("This is the TYPE:",data[0].content_type);
                if (data[0].stage_type) {
                    stage_type = data[0].stage_type;
                }
                if (data[0].title.toUpperCase().includes('COMPLAINT')) {
                    stage_type = 'complaint';
                }

                //stage_type = data[0].content_type;
                // saveStage(message,stage_type,stage);
                //console.log("data[0]: is here");
                msg += data[0].content;
                m.msg = msg;
                m.stage_type = stage_type;
                console.log("Now returning m", m);
                return m;
            } else if (data.length > 1) {
                //Get array of titles
                var msg = '';
                var lastmsg = '';
                stageDetails = [];
                var n = 0;
                data.forEach((item) => {
                    if (item.title) {
                        n++;
                        msg += n + '. ' + item.title + '\n';
                        stageDetails.push({ option: n, contentId: item._id, title: item.title });
                        lastmsg = '*' + item.title.trim() + '*\n' + item.content;
                    }
                });
                if (n == 1) {
                    m.msg = lastmsg;
                    m.stageDetails = stageDetails;
                    return m;
                } else if (n > 1) {
                    //    saveStage(message,stage_type,stage_type,stageDetails);
                    msg += '#. Back\n\n';
                    msg += 'Please select your option from the list given above.'
                    m.msg = msg;
                    m.stageDetails = stageDetails;
                    return m;
                }
            }
        } else {
            m.msg = 'Still getting data on this topic.... Will update you shortly.';
            return m;
        }
    }

    const getContentById = async function (contentId) {
        data = await Contents.findById(contentId);
        if (data) {
            var msg = '';
            if (data.title) {
                msg = '*' + data.title.trim() + '*\n'
            }
            msg += data.content;
            return msg;
        } else {
            return 'Still getting data on this topic.... Will update you shortly.';
        }
    }

    const getMenuById = async function (contentId, message) {
        data = await Menu.findById(contentId);
        if (data) {
            return await getMenuText(data.stage, message);
        } else {
            return 'Still getting data on this topic.... Will update you shortly.';
        }
    }

    const getContentFromText = async function (stage, message) {
        var txt = message.body
        var stage_type = 'content';
        data = await Contents.find({
            $text: { $search: txt, $language: 'english' }
        });
        if (data.length == 0) {
            var msg = 'Could not find any information on what you have asked.\n';
            msg += 'Your enquiry has been forwarded to Customer Services.\n';
            m = await getMenuText('A', message);
            m.msg = msg + m.msg;
            return m;
        } else if (data.length == 1) {
            var msg = ''; var img = '';
            if (data[0].title) {
                msg = '*' + data[0].title.trim() + '*\n'
            }
            if (data[0].image) {
                img = data[0].image;
            }
            if (data[0].content_type) {
                stage_type = data[0].content_type;
            }
            msg += data[0].content;
            var m = {
                "msg": msg,
                "img": img,
                "stage_type": stage_type,
                "stage": stage_type
            }
            return m;
        } else if (data.length > 1) {
            //Get array of titles
            var msg = '';
            var lastmsg = '';
            var m = {
                "msg": msg,
                "img": img,
                "stage_type": stage_type,
                "stage": stage_type,
                "stageDetails": []
            }
            stageDetails = [];
            var n = 0;
            data.forEach((item) => {
                if (item.title) {
                    n++;
                    msg += n + '. ' + item.title + '\n';
                    stageDetails.push({ option: n, contentId: item._id, title: item.title });
                    lastmsg = '*' + item.title.trim() + '*\n' + item.content;
                }
            });
            if (n == 1) {
                m = {
                    "msg": lastmsg,
                    "img": "",
                    "stage_type": stage_type,
                    "stage": stage_type,
                    "stageDetails": []
                };
                return m;
            } else if (n > 1) {
                msg += '#. Back\n\n';
                msg += 'Please select your option from the list given above.'
                var m = {
                    "msg": msg,
                    "img": img,
                    "stage_type": stage_type,
                    "stage": stage_type,
                    "stageDetails": stageDetails
                }
                return m;
            }
        }
    }

    const sendMessage = async function (originalMessage, msg) {
        console.log(msg);

        if (Array.isArray(msg)) {
            mesgs = msg;
            stage_type = msg[0].stage_type;
            stageDetails = msg[0].stateDetails;
            stage = msg[0].stage;
        } else {
            if (typeof (msg) == "object") {
                if (msg.msg && (typeof (msg.msg) == "object")) {
                    msg = msg.msg;
                }
            }
            txt = msg.msg;
            mesgs = [msg];
            if (typeof (txt) === 'string') {
                if (txt) {
                    if (txt.indexOf('Still getting data on this') > 0) {
                        var msg2 = await getMenuText('A', originalMessage);
                        mesgs.push(msg2);
                    }
                }
            }
            stage_type = msg.stage_type;
            stageDetails = msg.stateDetails;
            stage = msg.stage;
        }

        //build the response mesg
        // [
        //     {
        //         "text": "txt of message",
        //         "chaId": "ChatId of Recipient of message"
        //         "files": [
        //             {
        //                 "name": "name of file",
        //                 "file": "base64 of image/file"
        //             }
        //         ]
        //     }
        // ]
        responseMesgs = [];
        mesgs.forEach(async mesg => {
            newMsg = {};
            if (typeof (mesg) == "object") {
                newMsg = mesg;
            }
            if (mesg.chatId) {
                newMsg.chatId = mesg.chatId;
            } else {
                if (originalMessage.chatId)
                    newMsg.chatId = originalMessage.chatId;
                else newMsg.chatId = data.chatId;
            }
            if (mesg.text) {
                newMsg.text = mesg.text;
            } else if (mesg.msg) {
                newMsg.text = mesg.msg;
            } else {
                if (typeof (mesg) == "string")
                    newMsg.text = mesg;
                else newMsg.text = "Sorry... there is no information yet on this";
            }
            files = []
            if (mesg.img !== undefined && mesg.img.length > 1) {
                var image = await findImage(responseText.img);
                files = [{
                    "name": "image.jpg",
                    "file": image.base64
                }]
            }
            if (files.length > 0) {
                newMsg.files = files;
            }
            responseMesgs.push(newMsg);
        });
        console.log("RESPONSE::", responseMesgs);

        res.send(responseMesgs);

        saveStage(originalMessage, stage_type, stage, stageDetails);

    };


    const sendQuickMessage = async function (ph, txt) {
        data = {
            phone: ph,
            body: txt
        }
        request({
            url: url2,
            method: "POST",
            json: data
        },
            function (error, response, body) {
                if (error) {
                    return console.error('sendQuickMessage failed:', error);
                }
                console.log('sendQuickMessage successful!  Server responded with:', body, data);
            });
        console.log('message sent to :' + ph, data);

    }

    const forwardMessage = async function (ph, msgid) {
        data = {
            phone: ph,
            messageId: msgid
        }

        request({
            url: url3,
            method: "POST",
            json: data
        },
            function (error, response, body) {
                if (error) {
                    return console.error('forwardMessage failed:', error);
                }
                console.log('forwardMessage successful!  Server responded with:', body, data);
            });

    }

    const getLastStage = async function (message) {
        var phoneNumber = getPhoneNumber(message);
        // var stages = new Stages;
        st = await Stages.findById(phoneNumber)
        if (st) {
            return st;
        } else {
            return {
                "stage": 'A',
                "stage_type": "menu",
                "stageDetails": []
            };
        }
    }

    function saveStage(message, stage_type, stage, stageDetails) {
        if (!stage) return;
        console.log("saving stage:", stage_type, stage);
        var id = getPhoneNumber(message);
        if (stageDetails) {
            details = stageDetails;
        } else {
            details = [];
        }
        Stages.findById(id).then((data) => {
            if (data) {
                Stages.updateOne({ _id: id },
                    {
                        stage: stage,
                        stage_type: stage_type,
                        phoneNumber: getPhoneNumber(message),
                        name: message.senderName,
                        details: details
                    }, function (err, data) {
                        if (err) console.log('Stage not updated', err)
                    });
            } else {// insert
                Stages.create(
                    {
                        _id: getPhoneNumber(message),
                        stage: stage,
                        stage_type: stage_type,
                        phoneNumber: getPhoneNumber(message),
                        name: message.senderName,
                        details: details
                    }, function (err, data) {
                        if (err) console.log('Stage not saved', err)
                    }
                );
            }
        });
        PreviousStages.create({
            stage: stage,
            phoneNumber: getPhoneNumber(message),
            name: message.senderName,
            msg: message.body,
            details: details
        }, function (err, data) {
            if (err) console.log('PreviousStage not saved', err)
        })
    }


    var data = req.body; // New messages in the "body" variable
    // console.log("This is the full message OBJECT");
    // console.log(data);
    //for (var i = 0; i < data.messages.length; i++) { // For each message
    var time = new Date().getTime() / 1000;
    var message = data.messages[0];
    var text = message.body.toUpperCase();
     console.log(message);
    if (message.fromMe == false){
        data.messages.forEach((message)=>{
            //console.log('Incoming message From:'+ message.author+' >>'+messag>
            Messages.create(message, function (err, data){
                if (err) console.log('Message not saved',err)
                }
            );
            if (!message.fromMe) {
                //1. Check if first message
                message.text = message.body;
                analyseResponse(message); 
            }
        });
    }



});



module.exports = router;
