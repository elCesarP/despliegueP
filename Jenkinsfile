pipeline {
    agent {
        docker { image 'node:18' }
    }
    stages {
        stage('Build') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Deploy') {
            steps {
                sh 'echo "Desplegando..."'
            }
        }
    }
}
