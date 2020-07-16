angular.module('sendmailApp', [])
.controller('MailController', function ($scope,$http) {
    $scope.loading = false;
    $scope.send = function (mail){
        $scope.loading = true;
        $http.post('/sendemail', {
            to: mail.to,
            subject: 'Message from AngularCode',
            text: mail.message
        }).then(res=>{
            $scope.loading = false;
            $scope.serverMessage = 'Email sent successfully';
        });
    }
 
})