(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";

// node.js core modules

let EventEmitter = require('events').EventEmitter;
let util = require('util');

// off-the-record client constructor
let Client = require('./client');

class OffTheRecord_Browser_App extends EventEmitter {
  constructor() {
    super();

    let self = this;

    const DEFAULT_VIEW = 'dashboard';

    let currentView;
    let permissions;

    let buttons = { menu: $('#menuBtn') };
    let viewElements = $('.pageView');

    // create an object mapping view names to their initializer functions
    let viewInitializers = new Map([['profile', initProfile], ['search', initSearch], ['friends', initFriends]]);

    // initialize client
    // setup client event handlers
    this.client = new Client();

    // this.client.on('error', function (err) {
    //   console.error("OffTheRecord:client err:", err);
    // });

    // this.client.on('requests:sent', function requestSent (username) {
    //   alert('sent friend request to ' + username);
    //   buttons.searchUsers.click();
    //   friends_update();
    // });

    // this.client.on('requests:received', function requestReceived (username) {
    //   alert('received friend request from ' + username);
    //   buttons.searchUsers.click();
    //   friends_update();
    // });

    // this.client.on('requests:received:accepted', function requestReceivedAccepted (username) {
    //   alert('You accepted ' + username + '\'s friend request');
    //   buttons.searchUsers.click();
    //   friends_update();
    // });

    // this.client.on('requests:sent:accepted', function requestSentAccepted (username) {
    //   alert(username + ' accepted your friend request');
    //   buttons.searchUsers.click();
    //   friends_update();
    // });

    // this.client.on('requests:received:denied', function requestReceivedDenied (username) {
    //   alert('You denied ' + username + '\'s friend request');
    //   buttons.searchUsers.click();
    //   friends_update();
    // });

    // this.client.on('requests:sent:denied', function requestSentDenied (username) {
    //   buttons.searchUsers.click();
    //   friends_update();
    // });

    // this.client.on('requests:received:canceled', function requestReceivedCanceled (username) {
    //   buttons.searchUsers.click();
    //   friends_update();
    // });

    // this.client.on('requests:sent:canceled', function requestSentCanceled (username) {
    //   alert('You canceled ' + username + '\'s friend request');
    //   buttons.searchUsers.click();
    //   friends_update();
    // });

    // this.client.on('friends:unfriended', function unfriended (unfriendedEvent) {

    //   if (this.user.username === unfriendedEvent.unfriender) {
    //     alert('You unfriended ' + unfriendedEvent.unfriended);
    //   }

    //   buttons.searchUsers.click();
    //   friends_update();
    // });

    // this.client.on('friends:logon', function friendLogon (friendId) {
    //   alert(this.user.friends[friendId].username + " logged on");
    // });

    // this.client.on('friends:logout', function friendLogout (friendId) {
    //   alert(this.user.friends[friendId].username + " logged off");
    // });

    this.client.once('ready', function clientReady() {
      // initialize app state based on user session and localStorage
      initState();

      // initialize UI
      initUI();
    }); // clientReady

    function initState() {}; // initState

    function initUI() {
      let wrapper = $('#wrapper');
      let content = $('#content');

      for (let view of viewInitializers) {
        console.log('initializing view', view[0]);
        view[1]();
      }

      let lastView = localStorage.getItem('otr:view');
      let initialView = viewInitializers.has(lastView) ? lastView : DEFAULT_VIEW;

      // if there is no state, then use our initialView above
      if (!window.history.state) {
        navigate(initialView);

        // if the browser was refreshed, the state will be valid, but only update the
        // view if the current view isn't already displayed.
      } else if (window.history.state !== currentView) {
          switchView(window.history.state);
          currentView = window.history.state;
        }

      $('#loggedOnUser').html(self.client.user.username);

      buttons.menu.on('vclick', function (tapEvent) {

        // State checker
        if (wrapper.attr('data-state') === 'neutral') {
          console.log('slide-right');
          wrapper.attr('data-state', 'slide-right');

          setTimeout(function () {
            content.on('vclick', clickMenu);
          });
        } else {
          console.log('slide-left');
          wrapper.attr('data-state', 'neutral');
          content.off('vclick');
        }
      });

      // buttons.menu.click();

      $('.navBtn').on('vclick', navBtnClicked);

      $('#loggedOnUser').on('vclick', navBtnClicked);
      $('#navLogout').on('vclick', logout);

      // $(window).on('resize', adjustForScrollbar);
      // adjustForScrollbar();
    }; // initUI

    function adjustForScrollbar() {

      var selector = '#wrapper';

      console.log('selector', selector);

      if ($(selector).hasVerticalScrollBar()) {

        $('#header').addClass('scrollbar');
      } else {
        $('#header').removeClass('scrollbar');
      }
    };

    function clickMenu() {
      buttons.menu.click();
      console.log('body click');
    }; // clickMenu

    function logout() {

      window.location.href = '/logout';
    }; // logout

    function navBtnClicked(event) {
      // event.preventDefault();

      let targetView = $(this).data('targetView');

      console.log('nav button clicked: %s', targetView);

      navigate(targetView);

      buttons.menu.click();
    }; // navBtnClicked

    function navigate(path) {

      console.log('attempting to navigate: ' + currentView + ' -> ' + path);

      let targetView = path.split('/')[0];
      let targetItemId = path.split('/')[1];

      console.log('targetView', targetView);
      console.log('targetItemId', targetItemId);

      if (!viewInitializers.has(targetView)) {

        let viewBeforeError = currentView;
        targetView = 'error';

        switchView(path);
      } else if (targetView !== currentView) {

        // if the is set
        if (window.history.state) {
          // push a new state
          console.log('pushing a new state');
          window.history.pushState(targetView, targetView, '#' + path);
        } else {
          // replace the current state
          console.log('replacing the current lack of state');
          window.history.replaceState(targetView, targetView, '#' + path);
        }

        switchView(path);

        localStorage.setItem('otr:view', targetView);
      } else {
        console.log('no need to navigate to the same page!');
      }

      console.log('window.history.state', window.history.state);
      console.log('history.length', window.history.length);
      console.log('currentView', currentView);
    }; // navigate

    function switchView(path) {

      var targetView = path.split('/')[0];
      var targetItemId = path.split('/')[1];

      var pageTitle;

      console.log('currentView', currentView);
      console.log('targetView', targetView);

      let titleText = targetView.charAt(0).toUpperCase() + targetView.slice(1);

      console.log('titleText', titleText);

      var pageTitle = $('#pageTitle');

      console.log('pageTitle', pageTitle);

      $('title').text(titleText + ' | Off-The-Record');

      // fade the page title text
      pageTitle.fadeOut(100, 'swing', function () {
        pageTitle.text(titleText);
        pageTitle.fadeIn(100, 'swing', function () {});
      });

      // if the current view isn't set, then just fade in the target view
      if (!currentView) {
        $('#' + targetView).fadeOut(100, function () {
          $('#' + targetView).fadeIn(100, 'swing');
        });
      } else {
        // fade out the current view, then fade in the target view
        console.log('output of fadeout', $('#' + currentView).fadeOut(100, 'swing', function () {
          $('#' + targetView).fadeIn(100, 'swing');
        }));
      }

      currentView = targetView;
    }; // switchView

    //
    //
    // define the viewInitializer functions...
    //
    // 

    function initFriends() {

      friends_update();
    }; // initFriends

    function friends_update() {

      console.log('self.client.user.friends', self.client.user.friends);
      console.log('self.client.user.requests', self.client.user.requests);
      console.log('self.client.user.permissions', self.client.user.permissions);

      let users = {
        friends: self.client.user.friends,
        sent: self.client.user.requests.sent,
        received: self.client.user.requests.received
      };

      let userLists = {
        friends: $('#friends_list'),
        sent: $('#requests_sent'),
        received: $('#requests_received')
      };

      for (let list in users) {

        console.log('list', list);

        // userLists[list].empty();

        users[list].forEach(function (user) {

          console.log('user', user);

          let userListItem = $('<li></li>');

          console.log('userListItem', userListItem);

          console.log('permissions[' + user + ']', self.client.user.permissions[user]);

          let username = ~self.client.user.permissions[user].indexOf('profile') ? '<a href="/app#user/' + user + '">' + user + '</a>' : user;

          userListItem.append(username);

          self.client.user.permissions[user].forEach(function (permission) {

            if (permission !== 'search' && permission !== 'profile') {
              let interactionButton = $('<button class="btn btn-default">' + permission + '</button>').on('vclick', function (clickEvent) {
                self.client[permission](user, function (err, result) {
                  if (err) {
                    console.error(err);
                  }

                  self.client.friends(friends_update);
                });
              });

              userListItem.append(interactionButton);
            }
          });

          userLists[list].append(userListItem);
        });
      }
    };

    function initProfile() {

      console.log('initProfile');

      let originalValues = {
        profile: {},
        privacy: {}
      };

      buttons.deleteAccount = $('#delete-account');

      buttons.profile = {
        cancel: $('#cancelProfile'),
        edit: $('#editProfile'),
        save: $('#saveProfile')
      };

      buttons.privacy = {
        cancel: $('#cancelPrivacy'),
        edit: $('#editPrivacy'),
        save: $('#savePrivacy')
      };

      buttons.profile.cancel.on('vclick', cancelProfile_onclick);
      buttons.profile.edit.on('vclick', editProfile_onclick);
      buttons.profile.save.on('vclick', saveProfile_onclick);

      buttons.privacy.cancel.on('vclick', cancelPrivacy_onclick);
      buttons.privacy.edit.on('vclick', editPrivacy_onclick);
      buttons.privacy.save.on('vclick', savePrivacy_onclick);

      buttons.profile.edit.attr('disabled', false);
      buttons.privacy.edit.attr('disabled', false);

      buttons.deleteAccount.on('vclick', deleteAccount_onclick);

      function cancelPrivacy_onclick(clickEvent) {
        clickEvent.preventDefault();

        $('#cancelPrivacy, #savePrivacy').fadeOut(100).promise().done(function () {
          $('#editPrivacy').fadeIn(100);
        });

        // remove the input elements
        $('#privacy-info select').each(function () {

          console.log('this', this);

          let property = this.id.split('privacy-')[1];
          // get the original value
          let value = originalValues.privacy[property];

          console.log('property', property);
          console.log('value', property);

          $('#privacy-' + property).replaceWith('<span id="privacy-' + property + '" class="editable">' + value + '</span>');
        });
      }; // cancelPrivacy_onclick

      function cancelProfile_onclick(clickEvent) {
        clickEvent.preventDefault();

        $('#cancelProfile, #saveProfile').fadeOut(100).promise().done(function () {
          $('#editProfile').fadeIn(100);
        });

        // remove the input elements
        $('#profile-info input').each(function () {

          let property = this.id.split('profile-')[1];
          let value = originalValues.profile[property];

          console.log('property', property);
          console.log('value', value);

          // now set the cell to just the value rather than an input with that value
          $('#profile-' + property).replaceWith('<span id="profile-' + property + '" class="editable">' + value + '</span>');
        });
      }; // cancelProfile_onclick

      // when the user clicks the deleteAccount button...
      function deleteAccount_onclick(clickEvent) {

        clickEvent.preventDefault();

        let confirmation = 'Are you sure you want to delete your account?\n\nTHIS CANNOT BE UNDONE!\n\n Please type "delete account" below to confirm.';

        if (prompt(confirmation) === 'delete account') {
          client.deleteAccount(function (err) {
            if (err) return console.error(err);

            alert('We successfully deleted your account!');
            window.location.href = '/';
          });
        }
      }; // deleteAccount_onclick

      // when the user clicks the editPrivacy button...
      function editPrivacy_onclick(clickEvent) {

        clickEvent.preventDefault();

        // 1) update the 'edit' button to say "cancel"
        // 2) change current values to input elements
        // 3) .show() / .toggle() save button

        $('#editPrivacy').fadeOut(100, function () {
          $('#cancelPrivacy, #savePrivacy').fadeIn(100);
        });

        // for each editable table cell
        $('#privacy-info .editable').each(function () {

          // this is the privacy property name
          let property = this.id.split('-')[1];
          let value = this.innerHTML;

          console.log('property', property);
          console.log('value', value);

          originalValues.privacy[property] = value;

          // create the select element
          let replacementHTML = '<select id="privacy-' + property + '">';

          // loop through each privacy property
          for (let level in client.privacy.values) {
            console.log('level', level);

            if (!(property === 'friendRequest' && level === 'FRIENDS')) {
              replacementHTML += '<option';

              if (level === value) {
                replacementHTML += ' selected';
              }

              replacementHTML += '>' + level + '</option>';
            }
          }

          replacementHTML += '</select>';

          $('#privacy-' + property).replaceWith(replacementHTML);
        });

        console.log('originalValues.privacy', originalValues.privacy);
      }; // // editPrivacy_onclick

      // when the user clicks the editProfile button...
      function editProfile_onclick(clickEvent) {
        clickEvent.preventDefault();

        $('#editProfile').fadeOut(100, function () {
          $('#cancelProfile, #saveProfile').fadeIn(100);
        });

        $('#profile-info .editable').each(function () {

          console.log('this', this);

          let property = this.id.split('-')[1];
          let value = this.innerHTML;

          console.log('property', property);
          console.log('value', value);

          originalValues.profile[property] = value;

          $('#profile-' + property).replaceWith('<input id="profile-' + property + '" placeholder="' + value + '" value="' + value + '" />');
        });

        console.log('originalValues.profile', originalValues.profile);
      }; // editProfile_onclick

      function savePrivacy_onclick(clickEvent) {

        clickEvent.preventDefault();

        $('#cancelPrivacy, #savePrivacy').fadeOut(100).promise().done(function () {
          $('#editPrivacy').fadeIn(100);
        });

        // setup an object that represents the updates made
        let updates = {};

        // remove the select elements
        $('#privacy-info select').each(function () {

          let property = this.id.split('privacy-')[1];
          let level = $(this).find(':selected')[0].value;

          console.log('property', property);
          console.log('level', level);

          // save the value to updates by the property name of the labeling cell
          updates[property] = client.privacy[level];

          console.log('updates[' + property + "]", updates[property]);

          // now set the cell to just the value rather than an input with that value
          $('#privacy-' + property).replaceWith('<span id="privacy-' + property + '" class="editable">' + level + '</span>');
        });

        console.log('updates', updates);

        client.updatePrivacy(updates, function (err, user) {

          if (err) {
            console.error(err);
          } else {
            alert('privacy updated!');

            console.log('updatedUser', user);
          }
        });
      }; // savePrivacy_onclick

      function saveProfile_onclick(clickEvent) {

        clickEvent.preventDefault();

        $('#cancelProfile, #saveProfile').fadeOut(100).promise().done(function () {
          $('#editProfile').fadeIn(100);
        });

        // setup an object that represents the updates made
        let updates = {};

        // remove the input elements
        $('#profile-info input').each(function () {

          let property = this.id.split('profile-')[1];

          // get the value of the input element
          let value = this.value;

          console.log('property', property);
          console.log('value', value);

          // save the value to updates by the property name of the labeling cell
          updates[property] = value;

          // now set the cell to just the value rather than an input with that value
          $('#profile-' + property).replaceWith('<span id="profile-' + property + '" class="editable">' + value + '</span>');
        });

        console.log('updates', updates);

        client.updateProfile(updates, function (err, user) {

          if (err) {
            console.error(err);
          } else {
            alert('profile updated!');

            console.log('updatedUser', user);
          }
        });
      }; // saveProfile_onclick
    }; // initProfile

    function initSearch() {

      console.log('initSearch');

      let resultLists = {
        friends: $('#results_friends'),
        friendsOfFriends: $('#results_friends-of-friends'),
        nonFriends: $('#results_non-friends')
      };

      buttons.searchUsers = $('#search-users');
      let searchInput = $('#search-input');

      searchInput.on('search', function onSearch(searchEvent) {
        let term = this.value;
        let findParams = {};

        if (term) findParams.conditions = { username: term };

        self.client.search(findParams, searchResults);
      });

      buttons.searchUsers.on('vclick', function searchUsers_onclick(clickEvent) {
        let term = searchInput[0].value;
        let findParams = {
          conditions: {
            username: term
          }
        };

        self.client.search(findParams, searchResults);
      });

      searchInput.attr('disabled', false);
      buttons.searchUsers.attr('disabled', false);
      buttons.searchUsers.click();

      function searchResults(err, results) {
        if (err) {
          console.error(err);
        }

        console.log('results', results);

        // loop through the result categories
        for (let category in results) {

          // console.log('category', category);

          // empty the unordered list of this result category
          resultLists[category].empty();

          // loop through the users in this catetory
          results[category].users.forEach(function (username) {

            // console.log('results[' + category + '].users[' + key + ']', user);

            // make a simple reference to the permissions of this user
            let grantedPermissions = results[category].permissions[username];

            let result = $('<li></li>');

            // if the searcher is not consented to view this user's profile, just display their username

            let usernameLink = ~grantedPermissions.indexOf('profile') ? '<a href="/app#user/' + username + '">' + username + '</a>' : username;

            // append their username to the result list item
            result.append(usernameLink);

            // loop through the permissions
            grantedPermissions.forEach(function (permission) {

              // console.log('permission', permission);

              // they wouldn't show up if we weren't consented to search, and we already handled
              // providing a link to their profile above
              if (permission !== 'search' && permission !== 'profile') {

                // create the base interactionButton element and store it in a local variable
                // so we don't need to give it an id to assign it a click handler
                let interactionButton = $('<button class="btn btn-default">' + permission + '</button>');

                // since we stored the element in a let, we can attach a click handler to it
                // without needing to query for an id.
                interactionButton.on('vclick', function (clickEvent) {

                  console.log('attempting to call client["' + permission + '"](...)...');

                  // call the corresponding client method to handle the interaction
                  self.client[permission](username, function (err, request) {
                    if (err) {
                      console.log('error when interacting with ' + username + ': ' + permission);
                      console.log('err', err);
                    } else {
                      console.log('successfully interacted with ' + username + ': ' + permission);
                    }
                  });
                });

                result.append(interactionButton);
              }
            });

            // console.log('result', result);

            resultLists[category].append(result);
          });
        };
      }; // searchResults
    }; // initSearch
  } // constructor

};

global.OffTheRecord = new OffTheRecord_Browser_App();

(function ($) {
  $.fn.hasVerticalScrollBar = function () {

    let element = this.get(0);

    console.log('element', $(element));

    console.log('scrollHeight', element.scrollHeight);
    console.log('offsetHeight', element.offsetHeight);
    console.log('clientHeight', element.clientHeight);

    // if scrollHeight is greater than offsetHeight, there will be overflow-y
    // and therefore the scrollbar will appear. 
    return element ? element.scrollHeight > element.offsetHeight : false;
  };
})(jQuery);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./client":2,"events":11,"util":21}],2:[function(require,module,exports){
'use strict';

let events = require('events'),
    privacy = require('./privacy'),
    relationships = require('../node_modules/friends-of-friends/lib/relationships'),
    url = require('url'),
    util = require('util'),
    utils = require('techjeffharris-utils');

function OffTheRecord_Client(options) {

  if (!(this instanceof OffTheRecord_Client)) return new OffTheRecord_Client(options);

  options = options || {};

  let defaults = {
    chunkSize: 512,
    pickerId: 'send-files-picker'
  };

  let config = utils.extend(defaults, options);

  let self = this;

  this.blobURLs = [];
  this.config = config;
  this.files = [];
  this.io = {};
  this.readers = [];
  this.url = url.parse(window.location.href);
  this.user;

  let socketioURL = util.format('%s//%s', this.url.protocol, this.url.host);

  console.log('socketioURL', socketioURL);

  this.io = io(socketioURL);

  //////////////////////////////////////////////////////////////////////////////
  //
  //  Define handlers for events received from server
  //
  //////////////////////////////////////////////////////////////////////////////

  // the socket has connected, but is not totally initialized, OR
  // an error has occurred while attempting to connect.
  this.io.on('connect', function ioConnecet(err) {
    if (err) {
      console.log(err);
      self.emit('error', err);
    }
  });

  // the socket has disconnected from the server
  this.io.on('disconnect', function ioDisconnect() {
    self.emit('disconnect');
  });

  // the server encountered an error handling this socket
  this.io.on('error', function connectionError(err) {
    // passport.socketio error message when authorization fails
    if (err === 'No session found') {
      window.location.href = '/login';
    } else {
      self.emit('error', err);
    }
  });

  this.io.on('shutdown', function serverShutdown() {
    self.emit('shutdown');
  });

  // the server has initialized this user and is ready for client requests
  this.io.on('ready', function ioReady(user) {

    self.user = user;

    console.log('user', user);

    console.log('ready');
    self.emit('ready');
  });

  this.io.on('requests:received', requestsReceived);
  this.io.on('requests:received:accepted', requestsReceivedAccepted);
  this.io.on('requests:received:canceled', requestsReceivedCanceled);
  this.io.on('requests:received:denied', requestsReceivedDenied);
  this.io.on('requests:sent', requestsSent);
  this.io.on('requests:sent:accepted', requestsSentAccepted);
  this.io.on('requests:sent:canceled', requestsSentCanceled);
  this.io.on('requests:sent:denied', requestsSentDenied);

  this.io.on('friends:logout', friendsLogout);
  this.io.on('friends:logon', friendsLogon);
  this.io.on('friends:unfriended', friendsUnfriended);

  this.io.on('convos:started', convosStarted);
  this.io.on('convos:ended', convosEnded);
  this.io.on('convos:joined', convosJoined);
  this.io.on('convos:left', convosLeft);
  this.io.on('convos:entered', convosEntered);
  this.io.on('convos:exited', convosExited);
  this.io.on('convos:message', convosMessage);
  this.io.on('convos:binary:incoming', convosBinaryIncoming);
  this.io.on('convos:binary:chunk', convosBinaryChunk);

  this.io.on('users:deleted', usersDeleted);

  function convosBinaryIncoming(convoId, username, transfer) {

    // save a copy of this file transfer
    self.user.convos[convoId].transfers[transfer.id] = transfer;

    // every so many chunks, there will be a progress update
    transfer.on('progress', function () {
      console.log('convos:binary:progress', convoId, username, transferId);
      self.io.emit('convos:binary:progress', convoId, username, transferId);
    });

    transfer.on('file-progress', function (fileId) {
      console.log('convos:binary:progress', convoId, username, transferId);
      self.io.emit('convos:binary:progress', convoId, username, transferId);
    });

    transfer.on('file-complete', function (fileId) {
      let file = transfer.files[fileId];

      if (this.user.username !== username) {
        file.data = b64toBlob(file.chunks.join(''));
      }

      console.log(util.format('transfer %s: %s complete.', transfer.id, file.name));
    });

    transfer.on('complete', function () {
      console.log('transfer ' + transfer.id + 'complete');

      // delete the transfer data
      transfer = undefined;
      delete state.transfers[transfer.id];
    });

    if (this.user.username === username) {
      console.log('server ready for transfer', transfer.id);

      console.log('this.files', this.files);

      console.log('starting binary transfer ' + transfer.id);

      sendChunk(transfer.id);
    } else {
      console.log(util.format('convo %s: incoming transfer %s from %', convoId, transfer.id, username));
    }
  }

  function convosBinaryChunk(convoId, username, transferId, fileId, chunkId, chunk) {

    // console.log('%s, %s, %s', transferId, fileId, chunkId);

    let transfer = self.transfers[transferId];

    // console.log('transfer', transfer);

    if (this.user.username !== username) {
      transfer.files[fileId].chunks[chunkId] = chunk;
    }

    transfer.chunk(fileId, chunk);

    if (this.user.username === username) {
      sendChunk(transferId);
    }
  };

  function convosEnded(convoId) {
    self.emit('convos:ended', convoId);
  };

  function convosEntered(convoId, username) {};

  function convosExited(convoId, username) {};

  function convosJoined(convo) {};

  function convosLeft(convo) {};

  function convosMessage(convoId, username, text) {

    self.emit('convos:message', convoId, username, text);
  };

  function convosStarted(convo) {
    console.log('convos:started', convo);
    self.user.convos[convoId] = convo;
    self.emit('convos:started', convo);
  };

  function friendsLogout(username) {
    console.log('friends:logout', username);
    self.emit('friends:logout', username);
  };

  function friendsLogon(username) {
    console.log('friends:logon', username);
    self.emit('friends:logon', username);
  };

  function friendsUnfriended(unfriendedEvent) {
    console.log('friends:unfriended', unfriendedEvent);

    let initiatedByClientUser = self.user.username === unfriendedEvent.unfriender;

    console.log('initiatedByClientUser', initiatedByClientUser);

    let username = initiatedByClientUser ? unfriendedEvent.unfriended : unfriendedEvent.unfriender;

    console.log('username', username);

    // remove the friend's username from the user's friends
    let index = self.user.friends.indexOf(username);
    self.user.friends.splice(index, 1);

    delete self.user.permissions[username];

    self.emit('friends:unfriended', unfriendedEvent);
  };

  function requestsReceivedAccepted(acceptEvent) {
    console.log('requests:received:accepted', acceptEvent);
    console.log('self.user.requests.received', self.user.requests.received);

    // determine the username of the friend
    let friendUsername = acceptEvent.from;

    console.log();

    console.log(self.user);

    // remove the friend's username from the user's requests
    let index = self.user.requests.received.indexOf(friendUsername);
    self.user.requests.received.splice(index, 1);

    // add the new friend to the user's friends
    self.user.friends.push(friendUsername);
    self.user.permissions[friendUsername] = acceptEvent.permissions;

    console.log('this.user', self.user);

    self.emit('requests:received:accepted', friendUsername);
  };

  function requestsSentAccepted(acceptEvent) {
    console.log('requests:sent:accepted', acceptEvent);

    console.log('self.user', self.user);

    // determine the username of the friend
    let friendUsername = acceptEvent.to;

    console.log('friendUsername', friendUsername);

    // remove the friend's username from the user's requests
    let index = self.user.requests.sent.indexOf(friendUsername);

    console.log('index', index);

    self.user.requests.sent.splice(index, 1);

    // add the new friend to the user's friends
    self.user.friends.push(friendUsername);
    self.user.permissions[friendUsername] = acceptEvent.permissions;

    console.log('this.user', self.user);

    self.emit('requests:sent:accepted', friendUsername);
  };

  function requestsReceivedCanceled(from) {
    console.log('requests:received:canceled', from);

    // remove the friend's username from the user's requests
    let index = self.user.requests.received.indexOf(from);
    self.user.requests.received.splice(index, 1);

    delete self.user.permissions[from];

    console.log('this.user', self.user);

    self.emit('requests:received:canceled', from);
  };

  function requestsSentCanceled(to) {
    console.log('requests:sent:canceled', to);

    // remove the friend's username from the user's requests
    let index = self.user.requests.sent.indexOf(to);
    self.user.requests.sent.splice(index, 1);

    delete self.user.permissions[to];

    console.log('this.user', self.user);

    self.emit('requests:sent:canceled', to);
  };

  function requestsReceivedDenied(from) {
    console.log('requests:received:denied', from);

    // remove the friend's username from the user's requests
    let index = self.user.requests.received.indexOf(from);
    self.user.requests.received.splice(index, 1);

    delete self.user.permissions[from];

    console.log('this.user', self.user);

    self.emit('requests:received:denied', from);
  };

  function requestsSentDenied(to) {
    console.log('requests:sent:denied', to);

    // remove the friend's username from the user's requests
    let index = self.user.requests.sent.indexOf(to);
    self.user.requests.sent.splice(index, 1);

    delete self.user.permissions[to];

    console.log('this.user', self.user);

    self.emit('requests:sent:denied', to);
  };

  function requestsReceived(receivedEvent) {
    console.log('requests:received', receivedEvent);

    let username = receivedEvent.from;

    self.user.requests.received.push(username);
    self.user.permissions[username] = receivedEvent.permissions;

    console.log('this.user', self.user);

    self.emit('requests:received', username);
  };

  function requestsSent(sentEvent) {
    console.log('requests:sent', sentEvent);

    let username = sentEvent.to;

    self.user.requests.sent.push(username);
    self.user.permissions[username] = sentEvent.permissions;

    console.log('this.user', self.user);

    self.emit('requests:sent', username);
  };

  function sendChunk(transferId) {

    let transfer = self.transfers[transferId];
    let fileId = transfer.fileId;
    let chunkId = transfer.chunkId;
    let chunk = transfer.files[fileId].data.slice(transfer.offset, transfer.offset + self.config.chunkSize);

    self.io.emit('transfer-data', convoId, transferId, fileId, chunkId, chunk);
  }

  function b64toBlob(b64Data, contentType) {

    contentType = contentType || '';

    let blob;
    let byteCharacters = atob(b64Data);
    let byteArrays = [];
    let progress = 0;
    let totalChars = byteCharacters.length;

    for (let offset = 0; offset < byteCharacters.length; offset += self.config.chunkSize) {

      let percentage = Math.floor(offset / totalChars * 100);

      if (percentage > progress) {
        progress = percentage;

        if (progress % 10 === 0) {
          console.log('creating blob: ' + progress + '% complete...');
        }
      }

      let chunk = byteCharacters.slice(offset, offset + self.config.chunkSize);

      let byteNumbers = new Array(chunk.length);
      for (let i = 0; i < chunk.length; i++) {
        byteNumbers[i] = chunk.charCodeAt(i);
      }

      let byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    console.log('creating blob: 100% complete...');

    try {
      blob = new Blob(byteArrays, { type: contentType });
    } catch (e) {
      // TypeError old chrome and FF
      window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;

      if (e.name == 'TypeError' && window.BlobBuilder) {
        let bb = new BlobBuilder();
        bb.append(byteArrays);
        blob = bb.getBlob(contentType);
      } else if (e.name == "InvalidStateError") {
        // InvalidStateError (tested on FF13 WinXP)
        blob = new Blob(byteArrays, { type: contentType });
      } else {
        alert("We're screwed, blob constructor unsupported entirely");
      }
    }

    return blob;
  };

  function usersDeleted(error, success) {

    if (error) {
      console.error(err);
    }

    console.log('users:deleted', error, success);
    self.emit('usersDeleted', success);
  };
};

OffTheRecord_Client.prototype = new events.EventEmitter();

OffTheRecord_Client.prototype.privacy = privacy;
OffTheRecord_Client.prototype.relationships = relationships;

OffTheRecord_Client.prototype.search = function (findParams, done) {

  console.log('searching...');

  console.log('findParams', findParams);

  this.io.emit('users:search', findParams, done);
};

OffTheRecord_Client.prototype.pageId = function () {
  return window.location.pathname.split('/')[2];
};

OffTheRecord_Client.prototype.sendFiles = function (convoId) {
  let count = 0,
      file,
      picker = document.getElementById(this.config.pickerId),
      reader,
      fileList = [],
      total = picker.files.length;

  this.files = [];

  let files = [];

  for (let i = 0; i < picker.files.length; i++) {
    files[i] = picker.files[i];
  }

  console.log('files', files);

  files.forEach(function (file, i) {

    readers[i] = new FileReader();
    reader = readers[i];

    // TODO: setup events for each FileReader
    // specificly:
    //  * onprogress
    // https://developer.mozilla.org/en-US/docs/Web/API/FileReader#Event_handlers

    reader.onprogress = function (progressEvent) {

      let percentage = Math.floor(progressEvent.loaded / progressEvent.total * 100);

      console.log('reading %s %s\%...', file.name, percentage);
    };

    reader.onload = function (progressEvent) {

      let data = progressEvent.target.result;

      console.log('data.length', data.length);

      this.files.push({
        // content-type and encoding are before but binary data itself is found after the comma
        data: data,
        lastModifiedDate: new Date(file.lastModifiedDate),
        name: file.name,
        size: file.size,
        type: file.type
      });

      fileList.push({
        encodedLength: data.length,
        lastModifiedDate: new Date(file.lastModifiedDate),
        name: file.name,
        size: file.size,
        type: file.type
      });

      console.log('file encoded!');

      if (++count === total) {
        console.log('all files encoded!');

        self.io.emit('convos:binary:init', convoId, fileList);
      };
    };

    reader.readAsDataURL(file);
  });
};

OffTheRecord_Client.prototype.friends = function (done) {
  this.io.emit('friends', done);
};

OffTheRecord_Client.prototype.friendRequest = function (username, done) {
  console.log('requests:send', username);
  this.io.emit('requests:send', username, done);
};

OffTheRecord_Client.prototype.acceptRequest = function (username, done) {
  this.io.emit('requests:accept', username, done);
};

OffTheRecord_Client.prototype.cancelRequest = function (username, done) {
  this.io.emit('requests:cancel', username, done);
};

OffTheRecord_Client.prototype.denyRequest = function (username, done) {
  this.io.emit('requests:deny', username, done);
};

OffTheRecord_Client.prototype.unfriend = function (username, done) {
  this.io.emit('friends:unfriend', username, done);
};

OffTheRecord_Client.prototype.getInteractions = function (username, done) {
  this.io.emit('friends:interactions', username, done);
};

OffTheRecord_Client.prototype.sendMessage = function (convoId, message) {

  this.io.emit('convos:message', convoId, message);
};

OffTheRecord_Client.prototype.startConversation = function (invitees, done) {

  this.io.emit('convos:start', invitees, function (err, conversation) {
    console.log('err', err);
    if (err) return done(err);

    done(null, conversation);
  });
};

OffTheRecord_Client.prototype.inspectConversation = function (convoId) {};

OffTheRecord_Client.prototype.endConversation = function (convoId) {};

OffTheRecord_Client.prototype.leaveConversation = function (convoId) {};

OffTheRecord_Client.prototype.updatePrivacy = function (updates, done) {

  console.log('updates', updates);

  this.io.emit('privacy:update', updates, done);
};

OffTheRecord_Client.prototype.updateProfile = function (updates, done) {

  console.log('updates', updates);

  this.io.emit('profile:update', updates, done);
};

OffTheRecord_Client.prototype.viewProfile = function (username, done) {
  console.log('attempting to view ' + username + '\'s profile...');

  this.io.emit('profile:view', username, done);
};

OffTheRecord_Client.prototype.deleteAccount = function (done) {
  console.log('deleting ' + this.user.username + '\'s account...');

  this.io.emit('users:delete', done);
};

module.exports = OffTheRecord_Client;

},{"../node_modules/friends-of-friends/lib/relationships":7,"./privacy":3,"events":11,"techjeffharris-utils":8,"url":18,"util":21}],3:[function(require,module,exports){

var packageName = require('../package');
var debug = require('debug')(packageName + ':data:privacy');

/** @module privacy */
Object.defineProperty(module, 'exports', {
  value: {
    0: "ANYBODY",
    1: "FRIENDS_OF_FRIENDS",
    2: "PENDING_FRIENDS",
    3: "FRIENDS",
    4: "NOBODY",
    ANYBODY: 0,
    FRIENDS_OF_FRIENDS: 1,
    PENDING_FRIENDS: 2,
    FRIENDS: 3,
    NOBODY: 4
  }
});

Object.defineProperty(module.exports, 'names', {
  value: {
    0: "ANYBODY",
    1: "FRIENDS_OF_FRIENDS",
    2: "PENDING_FRIENDS",
    3: "FRIENDS",
    4: "NOBODY"
  }
});

Object.defineProperty(module.exports, 'values', {
  value: {
    ANYBODY: 0,
    FRIENDS_OF_FRIENDS: 1,
    PENDING_FRIENDS: 2,
    FRIENDS: 3,
    NOBODY: 4
  }
});

// debug('module.exports', module.exports);

},{"../package":10,"debug":4}],4:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":5}],5:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":6}],6:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = '' + str;
  if (str.length > 10000) return;
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],7:[function(require,module,exports){

// var debug = require('debug')('friends-of-friends:relationships');

module.exports = {
    '0':                    "NOT_FRIENDS",
    '1':                    "FRIENDS_OF_FRIENDS",
	'2': 					"PENDING_FRIENDS",
	'3': 					"FRIENDS",
    NOT_FRIENDS:            0,
    FRIENDS_OF_FRIENDS:     1,
    PENDING_FRIENDS: 		2,
    FRIENDS:                3
};

},{}],8:[function(require,module,exports){

module.exports = require('./lib/utils'); 
},{"./lib/utils":9}],9:[function(require,module,exports){

var BYTE  = 1;
var KB    = 1024 * BYTE;
var MB    = 1024 * KB;
var GB    = 1024 * MB;
var TB    = 1024 * GB;
var PB    = 1024 * TB;

var MILLISECOND = 1;
var SECOND      = 1000  * MILLISECOND;
var MINUTE      = 60    * SECOND;
var HOUR        = 60    * MINUTE;
var DAY         = 24    * HOUR;
var WEEK        = 7     * DAY;
var MONTH       = 30    * DAY;
var YEAR        = 365   * DAY;

// 
// "This one will strictly match latitude and longitude values that fall within the correct range:"
// ...
// Matches
// 
// +90.0, -127.554334 
// 45, 180
// -90, -180
// -90.000, -180.0000
// +90, +180
// 47.1231231, 179.99999999
// Doesn't Match
// 
// -90., -180.
// +90.1, -100.111
// -91, 123.456
// 045, 180
// 
// @see: http://stackoverflow.com/a/18690202/1690165
// 
var GPSRegExp = new RegExp(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/)

// matches valid latitude strings
var LatRegExp = new RegExp(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/);

// matches valid longitude strings
var LngRegExp = new RegExp(/^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/);

// @see - http://killdream.github.io/blog/2011/10/understanding-javascript-oop/index.html

// Aliases for the rather verbose methods on ES5
var descriptor  = Object.getOwnPropertyDescriptor, 
  properties  = Object.getOwnPropertyNames, 
  define_prop = Object.defineProperty;

function clone(parent) {

  parent = parent || {};

  var cloned = {};
  
  properties(parent).forEach(function(key) {
    define_prop(cloned, key, descriptor(parent, key)) 
  });

  return cloned;
};

function extend(original, extensions) {       

  original = original || {};
  extensions = extensions || {};

  properties(extensions).forEach(function(key) {
    define_prop(original, key, descriptor(extensions, key)) 
  });

  return original;
};

function getType (obj) {
  return (Number.isNaN(obj)) ? 'NaN' : ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
};

// returns that to which an XOR expression would evaluate
function XOR (a,b) {
  return ( a || b ) && !( a && b );
};


module.exports = {

  clone: clone,

  // emitter: function () {
  //     var cloned 
  // }
  extend: extend,
  getType: getType,
  XOR: XOR,
  GPSRegExp: GPSRegExp,
  LatRegExp: LatRegExp,
  LngRegExp: LngRegExp,

  BYTE: BYTE,
  KB: KB,
  MB: MB,
  GB: GB,
  TB: TB,
  PB: PB,
  
  MILLISECOND: MILLISECOND,
  SECOND: SECOND,
  MINUTE: MINUTE,
  HOUR: HOUR,
  DAY: DAY,
  WEEK: WEEK,
  MONTH: MONTH,
  YEAR: YEAR
};

},{}],10:[function(require,module,exports){
module.exports={
  "name": "off-the-record",
  "description": "Chat for the paranoid..",
  "version": "0.0.7",
  "author": {
    "name": "Jeff Harris",
    "email": "techjeffharris@gmail.com",
    "website": "http://intangiblehost.net"
  },
  "contributors": [
    {
      "name": "Zane",
      "email": "ydzane@gmail.com"
    },
    {
      "name": "Kyle Pasco",
      "email": "kylepasco@gmail.com"
    },
    {
      "name": "Dan Elliot"
    }
  ],
  "scripts": {
    "gen-key-signed-cert": "bin/gen-key-signed-cert.sh",
    "postinstall": "cd bin/ && ./gen-config-files.sh",
    "start": "bin/otr.sh",
    "start-dev": "bin/otr-dev.sh",
    "wheresmyconfig": "bin/wheresmyconfig.sh"
  },
  "main": "lib/index.js",
  "bin": "./server.js",
  "license": {
    "type": "BSD-3-Clause",
    "file:": "LICENSE"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/adminion/off-the-record.git"
  },
  "bugs": {
    "url": "https://github.com/techjeffharris/off-the-record/issues"
  },
  "keywords": [
    "binary",
    "chat",
    "encrypted",
    "file",
    "files",
    "https",
    "off-the-record",
    "private",
    "transfer",
    "secure"
  ],
  "dependencies": {
    "async": "1.x",
    "body-parser": "1.x",
    "browserify": "6.x",
    "connect-flash": "0.x",
    "connect-mongo": "0.x",
    "cookie-parser": "1.x",
    "debug": "*",
    "express": "4.x",
    "express-session": "1.x",
    "extend": "3.x",
    "friends-of-friends": "3.x",
    "jade": "1.x",
    "method-override": "2.x",
    "mongoose": "4.x",
    "morgan": "1.x",
    "passport": "0.x",
    "passport-local": "1.x",
    "passport-local-mongoose": "1.x",
    "passport.socketio": "3.x",
    "serve-favicon": "^2.3.0",
    "serve-static": "1.x",
    "shortid": "2.x",
    "socket.io": "1.x",
    "techjeffharris-utils": "1.x",
    "valid-url": "^1.0.9"
  },
  "devDependencies": {
    "babelify": "^7.2.0"
  }
}

},{}],11:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],12:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],13:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],14:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.3.2 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.3.2',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],15:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],16:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],17:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":15,"./encode":16}],18:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":19,"punycode":14,"querystring":17}],19:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],20:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],21:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":20,"_process":13,"inherits":12}]},{},[1]);
