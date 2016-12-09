var Socket;
const port = 8081;

var drop_group, 
	drop_voter, 
	login, 
	ready, 
	nominations, 
	form, 
	focus;

var voter = {
	'name': '',
	'stat_cat' : {
		'Pixel' : false, 
		'Vector' : false, 
		'VirtualModel' : false, 
		'VideoMaking' : false, 
		'WebsiteDesign' : false
	},
	'vote' : {
		'Pixel' : false, 
		'Vector' : false, 
		'VirtualModel' : false, 
		'VideoMaking' : false, 
		'WebsiteDesign' : false
	},
	'complete' : false
};

var category = ['Pixel', 'Vector', 'VirtualModel', 'VideoMaking', 'WebsiteDesign'];

var awards = function(thank){
	if (document.getElementById('award')){
		document.getElementById('award').parentElement.removeChild(document.getElementById('award'));
	} else {
		document.getElementById('title').innerText = "Thankies!";
		document.getElementById('form').parentElement.removeChild(document.getElementById('form'));
		document.getElementById('message').parentElement.removeChild(document.getElementById('message'));
		document.getElementById('nominations').parentElement.removeChild(document.getElementById('nominations'));
	}

	if (thank){
		Connect_ws.send(
			JSON.stringify({
				'to': 'awards'
			})
		)
	} else {
		Connect_ws.send(
			JSON.stringify({
				'to': 'voterz'
			})
		)
	}
};

var Connect_ws;
Connect_ws = new WebSocket("ws://"+window.location.hostname+":"+port);
	Connect_ws.onopen = function () {
		console.info("Connection has been opened");
		Connect_ws.send(JSON.stringify({
			'to': 'login'
		}))

		drop_group = document.getElementById('group');
		drop_voter = document.getElementById('name');
		form = document.getElementById('form');
		focus = document.getElementById('focus');
		login = document.getElementById('login');
		nominations = document.getElementById('nominations');

		drop_group.onchange = function(){
			Connect_ws.send(JSON.stringify({
				'to': 'get voters',
				'c': this.value
			}));
			this.disabled = true;
			drop_voter.disabled = false;
			document.getElementById('name_ph').innerText = 'Select a name from '+ this.value + '...';
		};

		drop_voter.onchange = function(){
			this.disabled = true;
			login.setAttribute("class", "ui fluid large red submit button");
			voter.name = this.value;
		};

		ready = function(){
			if (drop_group.disabled && drop_voter.disabled){
				if (confirm('Ready to vote, '+voter.name+' of '+drop_group.value+'?')){
					list_nominees();
				} else {
					drop_group.disabled = false;
					drop_group.value = "";
					drop_voter.value = "";
					drop_voter.disabled = true;
					document.getElementById('name_ph').innerText = 'Name (Select the group above)';
					var i=1;
					while (drop_voter.childElementCount>1){
						drop_voter.children[1].parentElement.removeChild(drop_voter.children[1])
						i++;
					}
				}
			} else {
				alert('Eh! Choose your grade / name first~')
			}
		};
	};

	Connect_ws.onmessage = function (){
		var msg = JSON.parse(event.data);

		switch (msg.to){
			case 'logged in' :
				console.debug('Hello,', msg.c);
				Connect_ws.send(JSON.stringify({
					'to': 'get groups'
				}));
				break;
			case 'list groups' :
				msg.c.forEach(function(gr){
					drop_group.appendChild(document.createElement('option')).id = gr.name;
					document.getElementById(gr.name).value = document.getElementById(gr.name).innerText = gr.name;
				})
				break;
			case 'list voters' :
				msg.c.forEach(function(v){
					drop_voter.appendChild(document.createElement('option')).id = v.name;
					document.getElementById(v.name).value = document.getElementById(v.name).innerText = v.name;
				})
				break;
			case 'list nominations' :
				category.forEach(function(cat){
					nominations.innerHTML += "<div id="+cat+"><h4>Click a picture below to vote for category: <br/><font size=6>"+cat+"</font></h4>";
					msg.c.forEach(function(nom){
						if (nom.category==cat) show(document.getElementById(cat), nom.id, nom.artist, nom.preview, nom.title);
					});
				});
				break;
			case 'voted' :
				alert('Thankies!');
				document.getElementById('message').parentElement.removeChild(document.getElementById('message'));
				document.getElementById('nominations').parentElement.removeChild(document.getElementById('nominations'))
				document.getElementById('title').innerText = "Thankies!";
				
				document.getElementById('column').appendChild(document.createElement('p')).id = 'award';				
				document.getElementById('award').innerHTML = "<a href=# onclick='awards()'>and the winner goes to...</a>";
				break;
			case 'awards':
				for (var p=0; p<5; p++){
					window['pieData_'+p] = [];
				}
				var awards_ = msg.c;
				var colors = [
					{c:"#F7464A", h: "#FF5A5E"},
					{c: "#46BFBD", h: "#5AD3D1"},
					{c: "#FDB45C", h: "#FFC870"},
					{c: "#949FB1", h: "#A8B3C5"},
					{c: "#4D5360", h: "#616774"}
				];

				// console.info(awards_)
				var i = 0;
				var maxie = -Infinity;
				var minie = +Infinity;
				var maxie_,minie_;

				category.forEach(function(c){
					document.getElementById('column').appendChild(document.createElement('div')).id = 'canv_'+i;
					document.getElementById('canv_'+i).appendChild(document.createElement('div')).innerHTML = c;
					window['canva_'+i] = document.getElementById('canv_'+i);
						window['canva_'+i].appendChild(document.createElement('canvas')).setAttribute('id', 'chart_'+i);
					document.getElementById('chart_'+i).setAttribute('width', '300');
					document.getElementById('chart_'+i).setAttribute('height', '300');
					var ii = 0;
					var max = -Infinity;

					awards_.forEach(function(a){
						if (a.sum>maxie){
							maxie = a.sum;
							maxie_ = a.artist;
						}
						if (a.sum<minie){
							minie = a.sum;
							minie_ = a.artist;
						}

						if (c==a.name){
							if (a.sum>max){
								document.getElementById('canv_'+i).appendChild(document.createElement('div')).innerHTML += "<br/>Winner: <b>" + a.artist + " - <i>'" + a.title + "'</i></b>";
								// console.warn('max', c ,a.sum);
								max = parseFloat(a.sum);
							}
							var num = Math.floor(Math.random()*4);
							window['pieData_'+i].push({
								'label': a.artist + " - '" + a.title.slice(0,13)+'..' + "'",
								'value': a.sum,
								'highlight': colors[ii]['h'],
								'color': colors[ii]['c']
							})
							ii++;
						}
					})

					var ctx = document.getElementById("chart_"+i).getContext("2d");
					window.myPie = new Chart(ctx).Pie(window['pieData_'+i]);
					i++;
					document.getElementById('column').appendChild(document.createElement('hr'));
				});
				
				document.getElementById('column').style.top = '100px'
				document.getElementById('column').style.height = '800px';
				document.getElementById('column').appendChild(document.createElement('div')).id = 'prizes';
				var prizes = document.getElementById('prizes');
					prizes.innerHTML = "<font size='6'> So, <i>traktir</i> all of us, <b>"+maxie_+'</b>! and finish those spicies, <b>'+minie_+'</b>!';
				Connect_ws.close();
				break;
			case 'voterz':
				var votvot = msg.c;
				document.getElementById('column').appendChild(document.createElement('div')).id = 'thanksto';
				votvot.forEach(function(v){
					document.getElementById('thanksto').innerHTML += v + ', ';
				});
				document.getElementById('column').style.top = '100px'
				break;
			default :
				break;
		}
	};

	Connect_ws.onclose = function (e){
		// alert('Voted. Thx for participating, anyway.');
		console.warn('Please refresh now...');
		// window.location.reload();
	};
	Connect_ws.onerror = function(error){
		alert('Turn the server phwlease');
		console.error('Turn the server on, phwlease');
	};

var list_nominees = function(){
	form.parentElement.removeChild(form);
	nominations.style.visibility = "";
	focus.setAttribute("class", "ui top aligned center aligned grid");
	Connect_ws.send(JSON.stringify({
		'to': 'get nominations'
	}));
}

var show = function(cat,id,art,prev,titl){
	cat.innerHTML += "<div><b>#"+id+" "+titl+"</b> - "+art+"<img id="+id+" src=nominations/"+prev+" width='100%' onclick='"+"vote("+cat.id+","+id+")'></div><hr></div>";
};
var complete = 0;
var vote = function(cat,nom){
	if (confirm('Are you sure to vote for the number '+nom+'?')){
		voter.vote[cat.id] = nom;
		voter['stat_cat'][cat.id] = true;
		complete++;
		
		if (complete==category.length){
			voter.complete = true;
		}
		if (voter.complete){
			Connect_ws.send(JSON.stringify({
				'to': 'vote',
				'v': voter.name,
				'noms': voter.vote
			}))
		} else {
			console.warn('Please continue voting,', voter.name);
			document.getElementById(cat.id).parentElement.removeChild(document.getElementById(cat.id))
		}
	} else {
		alert('Please continue voting; choose wisely.')
	}
};