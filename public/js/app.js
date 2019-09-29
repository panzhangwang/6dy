$(document).ready(function () {  
    $('#tags').tagsInput({
      'height':'100px',
      'width':'380px',
      'defaultText':'新标签'
    });
    $('#ips').tagsInput({
      'height':'100px',
      'width':'380px',
      'defaultText':'新IP'
    });
    $('#cuts').tagsInput({
      'height':'300px',
      'width':'480px',
      'defaultText':'新分词'
    });

    var langOpt = {
    "sProcessing":   "处理中...",
    "sLengthMenu":   "显示 _MENU_ 项结果",
    "sZeroRecords":  "没有匹配结果",
    "sInfo":         "显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项",
    "sInfoEmpty":    "显示第 0 至 0 项结果，共 0 项",
    "sInfoFiltered": "(由 _MAX_ 项结果过滤)",
    "sInfoPostFix":  "",
    "sSearch":       "搜索:",
    "sUrl":          "",
    "sEmptyTable":     "无数据",
    "sLoadingRecords": "载入中...",
    "sInfoThousands":  ",",
    "oPaginate": {
        "sFirst":    "首页",
        "sPrevious": "上页",
        "sNext":     "下页",
        "sLast":     "末页"
    },
    "oAria": {
        "sSortAscending":  ": 以升序排列此列",
        "sSortDescending": ": 以降序排列此列"
    }
  };
  $('.dtable').DataTable({
    "paging": false,
    "language": langOpt
  });

  $(document).on("click", '.send', function () {
    setupCSRF();
    var rid = this.id;

    Swal.fire({
      title: '确定删除吗？',
      text: "删除后无法恢复",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }).then((result) => {
      if (result.value) {
        $.post('/rows/'+rid+'/del', function(data, status){
          window.location = '/fs/' + data.name;
        });
      }
    });
  });

});
