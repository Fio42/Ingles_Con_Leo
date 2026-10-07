(function(){
  function init(root){
    var lists=root.querySelectorAll('.toeic-mini-opts'),answered=0,correct=0,total=lists.length,score=root.querySelector('.toeic-mini-progress'),result=root.querySelector('.toeic-mini-result');
    if(!lists.length || !score || !result) return;
    lists.forEach(function(list){
      var buttons=list.querySelectorAll('.option'),answer=Number(list.dataset.correct),feedback=list.parentNode.querySelector('.toeic-mini-fb');
      if(!buttons.length || !Number.isInteger(answer) || answer<0 || answer>=buttons.length || !feedback) return;
      buttons.forEach(function(button,index){button.addEventListener('click',function(){
        if(list.dataset.done)return;list.dataset.done='1';
        var ok=index===answer;
        buttons.forEach(function(item,itemIndex){item.disabled=true;if(itemIndex===answer)item.classList.add('correct');if(itemIndex===index&&!ok)item.classList.add('incorrect')});
        answered++;if(ok)correct++;score.textContent=answered+' de '+total+' respondidas';
        feedback.innerHTML='<strong>'+(ok?'¡Correcto! ':'Casi. ')+'</strong>'+list.dataset.explain;
        feedback.className='toeic-mini-fb show '+(ok?'ok':'bad');
        if(answered===total){result.hidden=false;result.innerHTML='<h3>Acertaste '+correct+' de '+total+'</h3><p>Revisa las explicaciones y vuelve a practicar cuando quieras.</p><a href="practica.html" class="btn btn-primary" style="width:fit-content">Practicar gratis</a>'}
      })})
    })
  }
  document.querySelectorAll('#grammarQuiz, #comparisonQuiz, #thereQuiz').forEach(init);
})();
